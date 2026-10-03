import { createPdfReport, drawReportTable } from '@/lib/pdf/report'

interface SituationPdfRow {
    employeeName: string
    typeDescription: string
    startDate: string
    endDate: string
    active: boolean
}

export interface SituationPdfPayload {
    title?: string
    generatedAt?: string
    filters?: {
        employee?: string
        type?: string
        sector?: string
        startDate?: string
        endDate?: string
        month?: string
        year?: string
    }
    situations: SituationPdfRow[]
}

export function isValidSituationPdfPayload(value: unknown): value is SituationPdfPayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>
    if (payload.title !== undefined && typeof payload.title !== 'string') return false
    if (
        payload.generatedAt !== undefined &&
        (typeof payload.generatedAt !== 'string' || Number.isNaN(Date.parse(payload.generatedAt)))
    )
        return false
    if (payload.filters !== undefined) {
        if (
            !payload.filters ||
            typeof payload.filters !== 'object' ||
            Array.isArray(payload.filters)
        )
            return false
        if (
            Object.values(payload.filters).some(
                (field) => field !== undefined && typeof field !== 'string',
            )
        )
            return false
    }
    return (
        Array.isArray(payload.situations) &&
        payload.situations.every((row: unknown) => {
            if (!row || typeof row !== 'object') return false
            const candidate = row as Record<string, unknown>
            return (
                typeof candidate.employeeName === 'string' &&
                typeof candidate.typeDescription === 'string' &&
                typeof candidate.startDate === 'string' &&
                typeof candidate.endDate === 'string' &&
                typeof candidate.active === 'boolean'
            )
        })
    )
}

function toBrDate(value?: string): string {
    if (!value?.trim() || value.trim().toLowerCase() === 'todos') return 'Todos'
    const [year, month, day] = value.split('T')[0].split('-')
    return year && month && day ? `${day}/${month}/${year}` : value
}

export function generateSituationsPdf(
    payload: SituationPdfPayload,
    signature: { companyName: string; website: string },
): Promise<Buffer> {
    const generatedAt = payload.generatedAt ? new Date(payload.generatedAt) : new Date()
    return createPdfReport(
        {
            title: payload.title?.trim() || 'Relatório de Situações',
            ...signature,
            subtitle: `Gerado em: ${generatedAt.toLocaleString('pt-BR')}`,
        },
        (doc) => {
            const filters = payload.filters
            const filterRows = [
                `Colaborador: ${filters?.employee?.trim() || 'Todos'}`,
                `Tipo: ${filters?.type?.trim() || 'Todos'}`,
                `Setor: ${filters?.sector?.trim() || 'Todos'}`,
                `Período: ${toBrDate(filters?.startDate)} até ${toBrDate(filters?.endDate)}`,
                `Mês: ${filters?.month?.trim() || 'Todos'}`,
                `Ano: ${filters?.year?.trim() || 'Todos'}`,
            ]
            doc.font('Helvetica').fontSize(10)
            for (const filter of filterRows) doc.text(filter)
            doc.moveDown()
            doc.font('Helvetica-Bold')
                .fontSize(12)
                .text(`Situações exibidas (${payload.situations.length})`)
            doc.moveDown(0.5)

            const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
            drawReportTable(
                doc,
                [
                    { label: 'Colaborador', width: width * 0.32 },
                    { label: 'Tipo', width: width * 0.23 },
                    { label: 'Data Inicial', width: width * 0.16, align: 'center' },
                    { label: 'Data Final', width: width * 0.16, align: 'center' },
                    { label: 'Status', width: width * 0.13, align: 'center' },
                ],
                payload.situations.map((row) => [
                    row.employeeName || '-',
                    row.typeDescription || '-',
                    row.startDate ? toBrDate(row.startDate) : '',
                    row.endDate ? toBrDate(row.endDate) : '',
                    row.active ? 'Ativo' : 'Inativo',
                ]),
            )
            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#495057')
                .text('Relatório baseado na listagem exibida na tela no momento da exportação.')
        },
    )
}
