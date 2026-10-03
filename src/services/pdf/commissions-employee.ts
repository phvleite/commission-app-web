import { createPdfReport, drawReportTable } from '@/lib/pdf/report'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'
import { formatDateFromDatabase } from '@/app/dashboard/commissions/utils/formatDate'

interface CommissionEmployeeRow {
    date: string
    employeeName: string
    sectorName: string
    situation: string
    totalCount: number
    eligibleCount: number
    sectorValue: number
    employeeValue: number
}

interface EmployeeMeritocracyRow {
    date: Date | string
    employeeName: string
    sectorName: string
    employeeValue: number
}

export interface CommissionEmployeePdfPayload {
    startDate: string
    endDate: string
    employeeId?: string
    data: CommissionEmployeeRow[]
    sectorSummary: { sectorName: string; sectorValue: number; employeeValue: number }[]
}

function isCents(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function isValidCommissionEmployeePdfPayload(
    value: unknown,
): value is CommissionEmployeePdfPayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>
    if (
        typeof payload.startDate !== 'string' ||
        typeof payload.endDate !== 'string' ||
        (payload.employeeId !== undefined && typeof payload.employeeId !== 'string') ||
        !Array.isArray(payload.data) ||
        !Array.isArray(payload.sectorSummary)
    ) {
        return false
    }

    const dataIsValid = payload.data.every((row: unknown) => {
        if (!row || typeof row !== 'object') return false
        const candidate = row as Record<string, unknown>
        return (
            typeof candidate.date === 'string' &&
            typeof candidate.employeeName === 'string' &&
            typeof candidate.sectorName === 'string' &&
            typeof candidate.situation === 'string' &&
            Number.isSafeInteger(candidate.totalCount) &&
            (candidate.totalCount as number) >= 0 &&
            Number.isSafeInteger(candidate.eligibleCount) &&
            (candidate.eligibleCount as number) >= 0 &&
            isCents(candidate.sectorValue) &&
            isCents(candidate.employeeValue)
        )
    })
    const sectorsAreValid = payload.sectorSummary.every((row: unknown) => {
        if (!row || typeof row !== 'object') return false
        const candidate = row as Record<string, unknown>
        return (
            typeof candidate.sectorName === 'string' &&
            isCents(candidate.sectorValue) &&
            isCents(candidate.employeeValue)
        )
    })

    return dataIsValid && sectorsAreValid
}

function normalizeDateForReport(value: string): string {
    const baseDate = value.includes('T') ? value.split('T')[0] : value
    return formatDateFromDatabase(baseDate)
}

function toDateSortKey(value: string): number {
    if (!value) return Number.POSITIVE_INFINITY
    const base = value.includes('T') ? value.split('T')[0] : value
    if (/^\d{4}-\d{2}-\d{2}$/.test(base)) {
        const [year, month, day] = base.split('-').map(Number)
        return new Date(year, month - 1, day).getTime()
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(base)) {
        const [day, month, year] = base.split('/').map(Number)
        return new Date(year, month - 1, day).getTime()
    }
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
}

export function generateCommissionEmployeePdf(params: {
    title: string
    payload: CommissionEmployeePdfPayload
    meritocracyValue: number
    meritocracyEntries: EmployeeMeritocracyRow[]
    companyName: string
    website: string
}): Promise<Buffer> {
    const commissionTotal = params.payload.data.reduce((total, row) => total + row.employeeValue, 0)
    const totalGeneral = commissionTotal + params.meritocracyValue
    const detailRows = [
        ...params.payload.data,
        ...params.meritocracyEntries.map((entry) => ({
            date: entry.date instanceof Date ? entry.date.toISOString() : entry.date,
            employeeName: '',
            sectorName: entry.sectorName,
            situation: 'Meritocracia',
            totalCount: 0,
            eligibleCount: 0,
            sectorValue: entry.employeeValue,
            employeeValue: entry.employeeValue,
        })),
    ].sort((first, second) => {
        const dateCompare = toDateSortKey(first.date) - toDateSortKey(second.date)
        if (dateCompare !== 0) return dateCompare
        return (
            first.sectorName.localeCompare(second.sectorName, 'pt-BR') ||
            first.situation.localeCompare(second.situation, 'pt-BR')
        )
    })

    return createPdfReport(
        { title: params.title, companyName: params.companyName, website: params.website },
        (doc) => {
            const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
            doc.font('Helvetica-Bold').fontSize(12).text('Resumo por Setor')
            doc.moveDown(0.5)
            drawReportTable(
                doc,
                [
                    { label: 'Setor', width: width * 0.4 },
                    { label: 'Valor Total do Setor', width: width * 0.3, align: 'right' },
                    { label: 'Valor do Colaborador', width: width * 0.3, align: 'right' },
                ],
                params.payload.sectorSummary.map((sector) => [
                    sector.sectorName,
                    `R$ ${formatCurrencyFromDatabase(sector.sectorValue)}`,
                    `R$ ${formatCurrencyFromDatabase(sector.employeeValue)}`,
                ]),
            )

            doc.moveDown()
            doc.font('Helvetica-Bold').fontSize(12).text('Detalhamento das Gorjetas')
            doc.moveDown(0.5)
            drawReportTable(
                doc,
                [
                    { label: 'Data', width: width * 0.13, align: 'center' },
                    { label: 'Situação', width: width * 0.17, align: 'center' },
                    { label: 'Qtde Total', width: width * 0.14, align: 'center' },
                    { label: 'Qtde Aptos', width: width * 0.14, align: 'center' },
                    { label: 'Gorjetas Setor', width: width * 0.21, align: 'right' },
                    { label: 'Gorjetas Colaborador', width: width * 0.21, align: 'right' },
                ],
                detailRows.map((row) => [
                    normalizeDateForReport(row.date),
                    row.situation,
                    String(row.totalCount),
                    String(row.eligibleCount),
                    `R$ ${formatCurrencyFromDatabase(row.sectorValue)}`,
                    `R$ ${formatCurrencyFromDatabase(row.employeeValue)}`,
                ]),
            )

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f2c4d')
            doc.text(`Total de Gorjetas: R$ ${formatCurrencyFromDatabase(commissionTotal)}`)
            if (params.meritocracyValue > 0) {
                doc.text(`Meritocracia: R$ ${formatCurrencyFromDatabase(params.meritocracyValue)}`)
                doc.text(
                    `Total Geral (Gorjetas + Meritocracia): R$ ${formatCurrencyFromDatabase(totalGeneral)}`,
                )
            } else {
                doc.text(`Total Geral: R$ ${formatCurrencyFromDatabase(totalGeneral)}`)
            }
        },
    )
}
