import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { getUtcRangeForCalendarDay, getUtcRangeForCalendarMonth } from '@/lib/date-timezone'
import { splitCents } from '@/lib/split-cents'
import { CommissionProcess } from '@/models/CommissionProcess'
import { Employee } from '@/models/Employee'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { Sector } from '@/models/Sector'
import { resolveEmployeeSectorForPeriod } from '@/services/employees/resolveEmployeeSector'

export class MeritocracyAllocationError extends Error {
    code: string
    details?: unknown

    constructor(code: string, message: string, details?: unknown) {
        super(message)
        this.code = code
        this.details = details
    }
}

export interface GenerateMeritocracyAllocationInput {
    tenantId: string
    competence: string
    timeZone: string
    selectedSectorIds: string[]
    includedEmployeeIds: string[]
    excludedEmployeeIds: string[]
    createdBy?: string
}

interface CompetenceParts {
    year: number
    month: number
}

function parseCompetence(competence: string): CompetenceParts {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(competence)

    if (!match) {
        throw new MeritocracyAllocationError(
            'INVALID_COMPETENCE',
            'Competência inválida. Use o formato AAAA-MM.',
        )
    }

    return { year: Number(match[1]), month: Number(match[2]) }
}

export async function calculateMeritocracyValue(input: {
    tenantId: string
    competence: string
    timeZone: string
}) {
    await connectDB()

    const { year, month } = parseCompetence(input.competence)
    const { start: periodStart, end: periodEnd } = getUtcRangeForCalendarMonth(
        year,
        month,
        input.timeZone,
    )

    const meritocracySector = await Sector.findOne({
        tenantId: input.tenantId,
        isMeritocracia: true,
    })
        .select('_id')
        .lean()

    if (!meritocracySector) {
        throw new MeritocracyAllocationError(
            'MERITOCRACY_SECTOR_NOT_FOUND',
            'Nenhum setor de meritocracia cadastrado para este tenant.',
        )
    }

    const [sectorSnapshots, successfulProcesses] = await Promise.all([
        SaleCommissionSector.find({
            tenantId: input.tenantId,
            sectorId: meritocracySector._id,
            date: { $gte: periodStart, $lte: periodEnd },
        })
            .select('date totalSectorValue')
            .lean(),
        CommissionProcess.find({
            tenantId: input.tenantId,
            status: 'success',
            date: { $gte: periodStart, $lte: periodEnd },
        })
            .select('date')
            .lean(),
    ])

    const successfulDateKeys = new Set(successfulProcesses.map((process) => process.date.getTime()))
    const totalMeritocracyValue = sectorSnapshots
        .filter((snapshot) => successfulDateKeys.has(snapshot.date.getTime()))
        .reduce((total, snapshot) => total + snapshot.totalSectorValue, 0)

    return { totalMeritocracyValue, periodStart, periodEnd }
}

export async function generateMeritocracyAllocation(input: GenerateMeritocracyAllocationInput) {
    await connectDB()

    const { year, month } = parseCompetence(input.competence)
    const { start: periodStart, end: periodEnd } = getUtcRangeForCalendarMonth(
        year,
        month,
        input.timeZone,
    )

    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const paymentDayKey = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const paymentDate = getUtcRangeForCalendarDay(paymentDayKey, input.timeZone)?.start ?? periodEnd

    const meritocracySector = await Sector.findOne({
        tenantId: input.tenantId,
        isMeritocracia: true,
    }).lean()

    if (!meritocracySector) {
        throw new MeritocracyAllocationError(
            'MERITOCRACY_SECTOR_NOT_FOUND',
            'Nenhum setor de meritocracia cadastrado para este tenant.',
        )
    }

    const { totalMeritocracyValue } = await calculateMeritocracyValue(input)

    if (totalMeritocracyValue <= 0) {
        throw new MeritocracyAllocationError(
            'NO_MERITOCRACY_VALUE',
            'Não há valor de meritocracia apurado para esta competência.',
        )
    }

    const selectedSectorIds = [...new Set(input.selectedSectorIds)].filter((id) =>
        Types.ObjectId.isValid(id),
    )
    const includedEmployeeIds = [...new Set(input.includedEmployeeIds)].filter((id) =>
        Types.ObjectId.isValid(id),
    )
    const excludedEmployeeIds = new Set(
        input.excludedEmployeeIds.filter((id) => Types.ObjectId.isValid(id)),
    )

    const [employeesFromSectors, employeesFromInclusion] = await Promise.all([
        selectedSectorIds.length
            ? Employee.find({ tenantId: input.tenantId, sectorId: { $in: selectedSectorIds } })
                  .select('_id name sectorId')
                  .lean()
            : Promise.resolve([]),
        includedEmployeeIds.length
            ? Employee.find({ tenantId: input.tenantId, _id: { $in: includedEmployeeIds } })
                  .select('_id name sectorId')
                  .lean()
            : Promise.resolve([]),
    ])

    const candidateEmployeesById = new Map<
        string,
        { _id: Types.ObjectId; name: string; sectorId: Types.ObjectId }
    >()

    for (const employee of [...employeesFromSectors, ...employeesFromInclusion]) {
        const employeeId = employee._id.toString()
        if (excludedEmployeeIds.has(employeeId)) continue
        candidateEmployeesById.set(employeeId, employee)
    }

    if (candidateEmployeesById.size === 0) {
        throw new MeritocracyAllocationError(
            'NO_RECIPIENTS_SELECTED',
            'Selecione ao menos um setor ou colaborador para a meritocracia.',
        )
    }

    const orderedCandidates = [...candidateEmployeesById.values()].sort((a, b) =>
        a._id.toString().localeCompare(b._id.toString()),
    )

    const ignoredEmployees: Array<{
        employeeId: Types.ObjectId
        employeeName: string
        reason: string
    }> = []
    const eligible: Array<{
        employeeId: Types.ObjectId
        employeeName: string
        sectorId: Types.ObjectId
        sectorName: string
    }> = []

    for (const candidate of orderedCandidates) {
        const history = await resolveEmployeeSectorForPeriod(
            input.tenantId,
            candidate._id.toString(),
            periodStart,
            periodEnd,
        )

        if (!history) {
            ignoredEmployees.push({
                employeeId: candidate._id,
                employeeName: candidate.name,
                reason: 'Colaborador não estava ativo no período da competência.',
            })
            continue
        }

        const sector = await Sector.findById(history.sectorId).select('name').lean()

        eligible.push({
            employeeId: candidate._id,
            employeeName: candidate.name,
            sectorId: history.sectorId,
            sectorName: sector?.name ?? 'Setor não encontrado',
        })
    }

    if (eligible.length === 0) {
        throw new MeritocracyAllocationError(
            'NO_ELIGIBLE_RECIPIENTS',
            'Nenhum colaborador selecionado estava ativo no período da meritocracia.',
            ignoredEmployees.map((employee) => ({
                employeeId: employee.employeeId.toString(),
                employeeName: employee.employeeName,
            })),
        )
    }

    const distributed = splitCents(totalMeritocracyValue, eligible.length)
    const recipients = eligible.map((employee, index) => ({
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        sectorId: employee.sectorId,
        sectorName: employee.sectorName,
        employeeValue: distributed[index],
    }))

    try {
        return await MeritocracyAllocation.create({
            tenantId: input.tenantId,
            competence: input.competence,
            periodStart,
            periodEnd,
            paymentDate,
            meritocracySectorId: meritocracySector._id,
            totalMeritocracyValue,
            recipientCount: recipients.length,
            selectedSectorIds,
            explicitlyIncludedEmployeeIds: includedEmployeeIds,
            explicitlyExcludedEmployeeIds: [...excludedEmployeeIds],
            recipients,
            ignoredEmployees,
            status: 'success',
            createdBy:
                input.createdBy && Types.ObjectId.isValid(input.createdBy)
                    ? input.createdBy
                    : undefined,
        })
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            throw new MeritocracyAllocationError(
                'COMPETENCE_ALREADY_LAUNCHED',
                'Já existe um lançamento de meritocracia para esta competência.',
            )
        }

        throw error
    }
}
