import { createPdfReport, drawReportTable } from '@/lib/pdf/report'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'
import { formatDateFromDatabase } from '@/app/dashboard/commissions/utils/formatDate'

export interface CommissionAllPdfPayload {
    startDate: string
    endDate: string
    data: { employeeName: string; sectorName: string; employeeValue: number }[]
    sectorSummary: { sectorName: string; sectorValue: number }[]
    salesSummary: { value: number; totalCommissionValue: number }[]
    situations?: {
        date: string
        employeeName: string
        sectorName: string
        totalCount: number
        eligibleCount: number
        situation: string
    }[]
}

function isCents(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function isValidCommissionAllPdfPayload(value: unknown): value is CommissionAllPdfPayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>
    if (
        typeof payload.startDate !== 'string' ||
        typeof payload.endDate !== 'string' ||
        !Array.isArray(payload.data) ||
        !Array.isArray(payload.sectorSummary) ||
        !Array.isArray(payload.salesSummary) ||
        (payload.situations !== undefined && !Array.isArray(payload.situations))
    ) {
        return false
    }

    const dataIsValid = payload.data.every((row: unknown) => {
        if (!row || typeof row !== 'object') return false
        const candidate = row as Record<string, unknown>
        return (
            typeof candidate.employeeName === 'string' &&
            typeof candidate.sectorName === 'string' &&
            isCents(candidate.employeeValue)
        )
    })
    const sectorsAreValid = payload.sectorSummary.every((row: unknown) => {
        if (!row || typeof row !== 'object') return false
        const candidate = row as Record<string, unknown>
        return typeof candidate.sectorName === 'string' && isCents(candidate.sectorValue)
    })
    const salesAreValid = payload.salesSummary.every((row: unknown) => {
        if (!row || typeof row !== 'object') return false
        const candidate = row as Record<string, unknown>
        return isCents(candidate.value) && isCents(candidate.totalCommissionValue)
    })
    const situationsAreValid =
        payload.situations === undefined ||
        payload.situations.every((row: unknown) => {
            if (!row || typeof row !== 'object') return false
            const candidate = row as Record<string, unknown>
            return (
                typeof candidate.date === 'string' &&
                typeof candidate.employeeName === 'string' &&
                typeof candidate.sectorName === 'string' &&
                Number.isSafeInteger(candidate.totalCount) &&
                (candidate.totalCount as number) >= 0 &&
                Number.isSafeInteger(candidate.eligibleCount) &&
                (candidate.eligibleCount as number) >= 0 &&
                typeof candidate.situation === 'string'
            )
        })

    return dataIsValid && sectorsAreValid && salesAreValid && situationsAreValid
}

interface GroupedEmployeeRow {
    employeeName: string
    sectorName: string
    totalCommission: number
}

function normalizeDateForReport(value: string): string {
    const baseDate = value.includes('T') ? value.split('T')[0] : value
    return formatDateFromDatabase(baseDate)
}

function getDateSortKey(value: string): string {
    return value.includes('T') ? value.split('T')[0] : value
}

export function generateCommissionAllPdf(params: {
    title: string
    payload: CommissionAllPdfPayload
    meritocracyTotal: number
    companyName: string
    website: string
}): Promise<Buffer> {
    const { payload } = params
    const groupedEmployees = Object.values(
        payload.data.reduce<Record<string, GroupedEmployeeRow>>((accumulator, row) => {
            const key = row.employeeName
            if (!accumulator[key]) {
                accumulator[key] = {
                    employeeName: row.employeeName,
                    sectorName: row.sectorName,
                    totalCommission: 0,
                }
            }
            accumulator[key].totalCommission += row.employeeValue
            return accumulator
        }, {}),
    ).sort(
        (first, second) =>
            first.employeeName.localeCompare(second.employeeName, 'pt-BR') ||
            first.sectorName.localeCompare(second.sectorName, 'pt-BR'),
    )

    const totalSales = payload.salesSummary.reduce((total, sale) => total + sale.value, 0)
    const totalSalesCommission = payload.salesSummary.reduce(
        (total, sale) => total + sale.totalCommissionValue,
        0,
    )
    const totalSectors = payload.sectorSummary.reduce(
        (total, sector) => total + sector.sectorValue,
        0,
    )
    const totalSectorsWithoutMerit = payload.sectorSummary
        .filter((sector) => sector.sectorName.toUpperCase() !== 'MERITOCRACIA')
        .reduce((total, sector) => total + sector.sectorValue, 0)
    const totalGeneral = groupedEmployees.reduce(
        (total, employee) => total + employee.totalCommission,
        params.meritocracyTotal,
    )
    const situations = [...(payload.situations ?? [])].sort((first, second) => {
        const firstDate = getDateSortKey(first.date)
        const secondDate = getDateSortKey(second.date)
        if (firstDate !== secondDate) return firstDate.localeCompare(secondDate, 'pt-BR')
        return (
            first.sectorName.localeCompare(second.sectorName, 'pt-BR') ||
            first.employeeName.localeCompare(second.employeeName, 'pt-BR')
        )
    })

    return createPdfReport(
        { title: params.title, companyName: params.companyName, website: params.website },
        (doc) => {
            const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
            doc.font('Helvetica').fontSize(10)
            doc.text(`Valor total das vendas: R$ ${formatCurrencyFromDatabase(totalSales)}`)
            doc.text(
                `Total de gorjetas do período: R$ ${formatCurrencyFromDatabase(totalSalesCommission)}`,
            )
            doc.text(
                `Meritocracia paga no período: R$ ${formatCurrencyFromDatabase(params.meritocracyTotal)}`,
            )

            doc.moveDown()
            doc.font('Helvetica-Bold').fontSize(12).text('Resumo por Setor', { align: 'center' })
            doc.moveDown(0.5)
            drawReportTable(
                doc,
                [
                    { label: 'Setor', width: width * 0.65 },
                    { label: 'Valor Total', width: width * 0.35, align: 'right' },
                ],
                payload.sectorSummary.map((sector) => [
                    sector.sectorName,
                    `R$ ${formatCurrencyFromDatabase(sector.sectorValue)}`,
                ]),
            )
            doc.font('Helvetica-Bold').fontSize(9)
            doc.text(`Total dos Setores: R$ ${formatCurrencyFromDatabase(totalSectors)}`)
            doc.text(
                `Total dos Setores (sem meritocracia): R$ ${formatCurrencyFromDatabase(totalSectorsWithoutMerit)}`,
            )

            doc.moveDown()
            doc.font('Helvetica-Bold').fontSize(12).text('Gorjetas por Colaborador', {
                align: 'center',
            })
            doc.moveDown(0.5)
            drawReportTable(
                doc,
                [
                    { label: 'Colaborador', width: width * 0.4 },
                    { label: 'Setor', width: width * 0.3 },
                    { label: 'Total no Período', width: width * 0.3, align: 'right' },
                ],
                groupedEmployees.map((employee) => [
                    employee.employeeName,
                    employee.sectorName,
                    `R$ ${formatCurrencyFromDatabase(employee.totalCommission)}`,
                ]),
            )
            doc.font('Helvetica-Bold')
                .fontSize(12)
                .fillColor('#0f2c4d')
                .text(
                    `${params.meritocracyTotal > 0 ? 'Total Geral (Gorjetas + Meritocracia)' : 'Total Geral'}: R$ ${formatCurrencyFromDatabase(totalGeneral)}`,
                )

            if (situations.length > 0) {
                doc.moveDown()
                doc.font('Helvetica-Bold')
                    .fontSize(12)
                    .fillColor('#1b1f23')
                    .text('Situações do Período', { align: 'center' })
                doc.moveDown(0.5)
                drawReportTable(
                    doc,
                    [
                        { label: 'Data', width: width * 0.12, align: 'center' },
                        { label: 'Colaborador', width: width * 0.2 },
                        { label: 'Setor', width: width * 0.18 },
                        { label: 'Situação', width: width * 0.2 },
                        { label: 'Qtd. Total', width: width * 0.15, align: 'center' },
                        { label: 'Qtd. Aptos', width: width * 0.15, align: 'center' },
                    ],
                    situations.map((situation) => [
                        normalizeDateForReport(situation.date),
                        situation.employeeName,
                        situation.sectorName,
                        situation.situation,
                        String(situation.totalCount),
                        String(situation.eligibleCount),
                    ]),
                )
            }
        },
    )
}
