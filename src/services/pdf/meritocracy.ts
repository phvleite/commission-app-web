import { createPdfReport, drawReportTable } from '@/lib/pdf/report'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'

interface MeritocracyRecipientPdfPayload {
    employeeName: string
    sectorName: string
    employeeValue: number
}

export interface MeritocracyPdfPayload {
    competence: string
    paymentDate: string
    totalMeritocracyValue: number
    recipientCount: number
    status: 'success' | 'cancelled'
    cancelReason?: string | null
    recipients: MeritocracyRecipientPdfPayload[]
}

function isCents(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function isValidMeritocracyPdfPayload(value: unknown): value is MeritocracyPdfPayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>
    if (
        typeof payload.competence !== 'string' ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(payload.competence) ||
        typeof payload.paymentDate !== 'string' ||
        Number.isNaN(Date.parse(payload.paymentDate)) ||
        !isCents(payload.totalMeritocracyValue) ||
        !Number.isInteger(payload.recipientCount) ||
        (payload.recipientCount as number) < 1 ||
        (payload.status !== 'success' && payload.status !== 'cancelled') ||
        (payload.cancelReason !== undefined &&
            payload.cancelReason !== null &&
            typeof payload.cancelReason !== 'string') ||
        !Array.isArray(payload.recipients) ||
        payload.recipients.length !== payload.recipientCount
    ) {
        return false
    }

    const recipients = payload.recipients as unknown[]
    return (
        recipients.every((recipient) => {
            if (!recipient || typeof recipient !== 'object') return false
            const candidate = recipient as Record<string, unknown>
            return (
                typeof candidate.employeeName === 'string' &&
                typeof candidate.sectorName === 'string' &&
                isCents(candidate.employeeValue)
            )
        }) &&
        recipients.reduce<number>(
            (total, recipient) =>
                total + (recipient as MeritocracyRecipientPdfPayload).employeeValue,
            0,
        ) === payload.totalMeritocracyValue
    )
}

const MONTH_NAMES = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
]

function formatCompetence(competence: string): string {
    const [year, month] = competence.split('-')
    return `${MONTH_NAMES[Number(month) - 1]}/${year}`
}

function formatDateBr(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

export function generateMeritocracyPdf(
    payload: MeritocracyPdfPayload,
    signature: { companyName: string; website: string },
): Promise<Buffer> {
    const title = `Relatório Geral de Meritocracia - ${formatCompetence(payload.competence)}`
    const recipients = [...payload.recipients].sort((first, second) =>
        first.employeeName.localeCompare(second.employeeName, 'pt-BR'),
    )

    return createPdfReport(
        {
            title,
            ...signature,
            subtitle: `Data de pagamento: ${formatDateBr(payload.paymentDate)}`,
        },
        (doc) => {
            doc.font('Helvetica').fontSize(10)
            doc.text(
                `Total da meritocracia: R$ ${formatCurrencyFromDatabase(payload.totalMeritocracyValue)}`,
            )
            doc.text(`Colaboradores contemplados: ${payload.recipientCount}`)
            if (payload.status === 'cancelled') {
                const reason = payload.cancelReason?.trim()
                doc.text(`Status: Cancelado${reason ? ` - ${reason}` : ''}`)
            }
            doc.moveDown()
            doc.font('Helvetica-Bold').fontSize(12).text('Colaboradores')
            doc.moveDown(0.5)

            const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
            drawReportTable(
                doc,
                [
                    { label: 'Colaborador', width: width * 0.55 },
                    { label: 'Setor', width: width * 0.25 },
                    { label: 'Valor', width: width * 0.2, align: 'right' },
                ],
                recipients.map((recipient) => [
                    recipient.employeeName || '-',
                    recipient.sectorName || '-',
                    `R$ ${formatCurrencyFromDatabase(recipient.employeeValue)}`,
                ]),
            )

            doc.font('Helvetica-Bold')
                .fontSize(10)
                .fillColor('#0f2c4d')
                .text(
                    `Total Geral: R$ ${formatCurrencyFromDatabase(payload.totalMeritocracyValue)}`,
                    { align: 'right' },
                )
        },
    )
}
