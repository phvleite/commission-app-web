import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Tenant } from '@/models/Tenant'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'

export const dynamic = 'force-dynamic'

interface MeritocracyRecipientPayload {
    employeeId: string
    employeeName: string
    sectorId: string
    sectorName: string
    employeeValue: number
}

interface MeritocracyPdfPayload {
    competence: string
    paymentDate: string
    totalMeritocracyValue: number
    recipientCount: number
    status: 'success' | 'cancelled'
    cancelReason?: string | null
    recipients: MeritocracyRecipientPayload[]
}

interface InstitutionalSignature {
    companyName: string
    website: string
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

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

function formatCompetence(competence: string): string {
    const [year, month] = competence.split('-')
    if (!year || !month) return competence
    return `${MONTH_NAMES[Number(month) - 1] ?? month}/${year}`
}

function formatDateBr(value: string): string {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(parsed)
}

function renderHtml(payload: MeritocracyPdfPayload, signature: InstitutionalSignature): string {
    const title = `Relatório Geral de Meritocracia — ${formatCompetence(payload.competence)}`

    const sortedRecipients = [...payload.recipients].sort((a, b) =>
        a.employeeName.localeCompare(b.employeeName, 'pt-BR'),
    )

    const rows = sortedRecipients
        .map(
            (recipient, index) => `
            <tr class="report-row-${index % 2 === 0 ? 'even' : 'odd'}">
                <td>${escapeHtml(recipient.employeeName)}</td>
                <td>${escapeHtml(recipient.sectorName)}</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(recipient.employeeValue)}</td>
            </tr>`,
        )
        .join('')

    return `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
        @page { size: A4; margin: 18mm 12mm; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            color: #1b1f23;
            margin: 0;
        }
        h1, h2 { margin: 0; }
        h1 { font-size: 20px; letter-spacing: .02em; }
        .header {
            border-bottom: 2px solid #0f2c4d;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .summary { margin-top: 8px; margin-bottom: 16px; line-height: 1.6; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        th {
            background: #f3f6fa;
            border: 1px solid #c9d3e0;
            text-align: left;
            padding: 7px;
            font-weight: 700;
        }
        td {
            border: 1px solid #d3dce8;
            padding: 7px;
        }
        .right { text-align: right; }
        .report-row-even td { background: #f5f9ff; }
        .report-row-odd td { background: #ffffff; }
        .total td {
            font-weight: 700;
            background: #d2e2f6 !important;
            color: #0f2c4d;
        }
        .institutional-signature {
            margin-top: 18px;
            padding-top: 8px;
            border-top: 1px solid #d3dce8;
            text-align: center;
            font-size: 10px;
            color: #495057;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(title)}</h1>
    </div>

    <div class="summary">
        <div><strong>Data de pagamento:</strong> ${escapeHtml(formatDateBr(payload.paymentDate))}</div>
        <div><strong>Total da meritocracia:</strong> R$ ${formatCurrencyFromDatabase(payload.totalMeritocracyValue)}</div>
        <div><strong>Colaboradores contemplados:</strong> ${payload.recipientCount}</div>
        ${
            payload.status === 'cancelled'
                ? `<div><strong>Status:</strong> Cancelado${payload.cancelReason ? ` — ${escapeHtml(payload.cancelReason)}` : ''}</div>`
                : ''
        }
    </div>

    <h2>Colaboradores</h2>
    <table>
        <thead>
            <tr>
                <th>Colaborador</th>
                <th>Setor</th>
                <th class="right">Valor</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
            <tr class="total">
                <td colspan="2">Total Geral</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(payload.totalMeritocracyValue)}</td>
            </tr>
        </tbody>
    </table>

    <p class="institutional-signature">${escapeHtml(signature.companyName)} | ${escapeHtml(signature.website)} | contato@commission.com.br</p>
</body>
</html>`
}

function isValidPayload(value: unknown): value is MeritocracyPdfPayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>
    return (
        typeof payload.competence === 'string' &&
        typeof payload.paymentDate === 'string' &&
        typeof payload.totalMeritocracyValue === 'number' &&
        Array.isArray(payload.recipients)
    )
}

export async function POST(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

    try {
        await connectDB()
        const tenant = await Tenant.findById(session.user.tenantId).select('name').lean()
        if (!tenant) {
            return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
        }

        const body: unknown = await request.json()

        if (!isValidPayload(body)) {
            return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
        }

        const html = renderHtml(body, {
            companyName: tenant.name,
            website: process.env.APP_BASE_URL ?? 'https://www.commission.com.br',
        })

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: 'load' })
        const pdf = await page.pdf({ format: 'A4', printBackground: true })
        await page.close()

        const pdfArrayBuffer = new ArrayBuffer(pdf.byteLength)
        new Uint8Array(pdfArrayBuffer).set(pdf)

        return new Response(pdfArrayBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="relatorio-meritocracia.pdf"',
            },
        })
    } catch (error) {
        console.error('Erro ao gerar PDF de meritocracia.', error)
        return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 })
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}
