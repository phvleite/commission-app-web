import { connectDB } from '@/lib/db'
import { Commission } from '@/models/Commission'
import { CommissionProcess } from '@/models/CommissionProcess'
import { Employee } from '@/models/Employee'
import { Sale } from '@/models/Sale'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import { Sector } from '@/models/Sector'
import { Situation } from '@/models/Situation'
import { SituationType } from '@/models/SituationType'
import { deleteCommissionsForDate } from '@/services/commissions/delete'

interface EmployeeRef {
    _id: { toString(): string }
    sectorId: { toString(): string }
}

function splitCents(total: number, parts: number): number[] {
    if (parts <= 0) return []

    const base = Math.floor(total / parts)
    const remainder = total % parts

    return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0))
}

function isDatabaseConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()
    const name = (error as Error & { name?: string }).name?.toLowerCase() ?? ''
    const code = (error as Error & { code?: string }).code?.toString().toLowerCase() ?? ''

    return (
        name.includes('mongo') ||
        name.includes('mongoose') ||
        name.includes('network') ||
        message.includes('connection lost') ||
        message.includes('timed out') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('timeout') ||
        code.includes('econn') ||
        code.includes('timedout')
    )
}

export async function generateCommissionsForDate(tenantId: string, date: Date): Promise<void> {
    await connectDB()

    await CommissionProcess.findOneAndUpdate(
        { tenantId, date },
        {
            $setOnInsert: {
                tenantId,
                date,
                status: 'processing',
                startedAt: new Date(),
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        },
    )

    try {
        // Limpa comissões anteriores
        await deleteCommissionsForDate(tenantId, date)

        // Busca venda do dia
        const sale = await Sale.findOne({ tenantId, date }).lean()
        if (!sale) {
            await CommissionProcess.findOneAndUpdate(
                { tenantId, date },
                {
                    $set: {
                        status: 'cancelled',
                        finishedAt: new Date(),
                        errorCode: 'sale_not_found',
                        message: 'Venda não encontrada para o cálculo de comissões.',
                    },
                },
            )
            return
        }

        // Busca TODOS os setores, inclusive Meritocracia
        const sectors = await Sector.find({
            tenantId,
            active: true,
        })
            .select('_id percentage isMeritocracia')
            .lean()

        if (!sectors.length) {
            await CommissionProcess.findOneAndUpdate(
                { tenantId, date },
                {
                    $set: {
                        status: 'cancelled',
                        finishedAt: new Date(),
                        errorCode: 'no_active_sectors',
                        message: 'Nenhum setor ativo encontrado para o cálculo.',
                    },
                },
            )
            return
        }

        // Busca colaboradores elegíveis (admissão/demissão)
        const allEmployees = (await Employee.find({
            tenantId,
            admissionDate: { $lte: date },
            $or: [
                { dismissalDate: { $exists: false } },
                { dismissalDate: null },
                { dismissalDate: { $gte: date } },
            ],
        })
            .select('_id sectorId')
            .lean()) as EmployeeRef[]

        const employeesBySector = new Map<string, EmployeeRef[]>()
        for (const employee of allEmployees) {
            const sectorId = employee.sectorId.toString()
            const current = employeesBySector.get(sectorId) ?? []
            current.push(employee)
            employeesBySector.set(sectorId, current)
        }

        const situations = await Situation.find({
            tenantId,
            active: true,
            employeeId: { $in: allEmployees.map((e) => e._id) },
            startDate: { $lte: date },
            endDate: { $gte: date },
        })
            .select('employeeId typeId')
            .lean()

        const situationTypes = await SituationType.find({
            tenantId,
            active: true,
        })
            .select('_id description')
            .lean()

        const typeDescriptionById = new Map(
            situationTypes.map((type) => [type._id.toString(), type.description]),
        )

        const employeeSituation = new Map<string, string>()
        for (const situation of situations) {
            const description = typeDescriptionById.get(situation.typeId.toString())
            if (description) {
                employeeSituation.set(situation.employeeId.toString(), description)
            }
        }

        for (const sector of sectors) {
            const sectorId = sector._id.toString()

            if (sector.isMeritocracia) {
                const sectorValue = Math.round(
                    (sale.totalCommissionValue * sector.percentage) / 100,
                )

                await SaleCommissionSector.create({
                    tenantId,
                    date,
                    sectorId: sector._id,
                    appliedPercentage: sector.percentage,
                    totalSectorValue: sectorValue,
                    totalEmployees: 0,
                    eligibleEmployees: 0,
                })

                continue
            }

            const employees = employeesBySector.get(sectorId) ?? []
            const totalEmployees = employees.length

            if (totalEmployees === 0) {
                continue
            }

            const eligibleEmployees = employees.filter(
                (employee) => !employeeSituation.has(employee._id.toString()),
            )

            const eligibleCount = eligibleEmployees.length
            const sectorValue = Math.round((sale.totalCommissionValue * sector.percentage) / 100)
            const distributed = splitCents(sectorValue, eligibleCount)

            await SaleCommissionSector.create({
                tenantId,
                date,
                sectorId: sector._id,
                appliedPercentage: sector.percentage,
                totalSectorValue: sectorValue,
                totalEmployees,
                eligibleEmployees: eligibleCount,
            })

            let eligibleIndex = 0

            for (const employee of employees) {
                const employeeId = employee._id.toString()
                const situation = employeeSituation.get(employeeId) ?? 'Apto'
                const isEligible = situation === 'Apto'

                await Commission.create({
                    tenantId,
                    date,
                    employeeId: employee._id,
                    sectorId: sector._id,
                    situation,
                    sectorValue,
                    employeeValue: isEligible ? distributed[eligibleIndex++] : 0,
                    eligibleCount,
                    totalCount: totalEmployees,
                })
            }
        }

        await CommissionProcess.findOneAndUpdate(
            { tenantId, date },
            {
                $set: {
                    status: 'success',
                    finishedAt: new Date(),
                    errorCode: undefined,
                    message: 'Cálculo de comissões concluído com sucesso.',
                },
            },
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao processar comissões.'
        const isNetworkFailure = isDatabaseConnectionError(error)

        await CommissionProcess.findOneAndUpdate(
            { tenantId, date },
            {
                $set: {
                    status: isNetworkFailure ? 'network_lost' : 'failed',
                    finishedAt: new Date(),
                    errorCode: isNetworkFailure
                        ? 'database_connection_lost'
                        : 'commission_generation_failed',
                    message,
                },
            },
        )

        throw error
    }
}
