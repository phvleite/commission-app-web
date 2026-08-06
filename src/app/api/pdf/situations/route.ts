import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { auth } from '@/auth'

interface SituationPdfRow {
    employeeName: string
    typeDescription: string
    startDate: string
    endDate: string
    active: boolean
}

interface SituationPdfPayload {
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

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

function toBrDate(value: string): string {
    if (!value) return ''
    const [year, month, day] = value.split('-')
    if (!year || !month || !day) return value
    return `${day}/${month}/${year}`
}

function renderFilterValue(value?: string): string {
    const normalized = value?.trim()
    return normalized ? escapeHtml(normalized) : 'Todos'
}

function renderFilterDateValue(value?: string): string {
    const normalized = value?.trim()
    if (!normalized || normalized.toLowerCase() === 'todos') {
        return 'Todos'
    }

    return escapeHtml(toBrDate(normalized))
}

function renderHtml(payload: SituationPdfPayload): string {
    const title = payload.title?.trim() || 'Relatorio de Situacoes'
    const generatedAt = payload.generatedAt ? new Date(payload.generatedAt) : new Date()
    const generatedLabel = generatedAt.toLocaleString('pt-BR')

    const rows = payload.situations
        .map(
            (row, index) => `
            <tr class="report-row-${index % 2 === 0 ? 'even' : 'odd'}">
                <td>${escapeHtml(row.employeeName || '-')}</td>
                <td>${escapeHtml(row.typeDescription || '-')}</td>
                <td class="center">${toBrDate(row.startDate)}</td>
                <td class="center">${toBrDate(row.endDate)}</td>
                <td class="center">${row.active ? 'Ativo' : 'Inativo'}</td>
            </tr>
        `,
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
        h1 { font-size: 21px; letter-spacing: .02em; }
        .header {
            border-bottom: 2px solid #0f2c4d;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .meta {
            margin-top: 8px;
            color: #495057;
            font-size: 11px;
        }
        .filters {
            margin: 14px 0;
            border: 1px solid #d3dce8;
            border-radius: 8px;
            padding: 10px;
            background: #f5f9ff;
        }
        .filters-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px 12px;
        }
        .label { font-weight: 700; }
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
        .center { text-align: center; }
        .report-row-even td { background: #f5f9ff; }
        .report-row-odd td { background: #ffffff; }
        .footer {
            margin-top: 12px;
            font-size: 11px;
            color: #495057;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">Gerado em: ${escapeHtml(generatedLabel)}</p>
    </div>

    <div class="filters">
        <div class="filters-grid">
            <div><span class="label">Colaborador:</span> ${renderFilterValue(payload.filters?.employee)}</div>
            <div><span class="label">Tipo:</span> ${renderFilterValue(payload.filters?.type)}</div>
            <div><span class="label">Setor:</span> ${renderFilterValue(payload.filters?.sector)}</div>
            <div><span class="label">Periodo:</span> ${renderFilterDateValue(payload.filters?.startDate)} ate ${renderFilterDateValue(payload.filters?.endDate)}</div>
            <div><span class="label">Mes:</span> ${renderFilterValue(payload.filters?.month)}</div>
            <div><span class="label">Ano:</span> ${renderFilterValue(payload.filters?.year)}</div>
        </div>
    </div>

    <h2>Situacões exibidas (${payload.situations.length})</h2>
    <table>
        <thead>
            <tr>
                <th>Colaborador</th>
                <th>Tipo</th>
                <th class="center">Data Inicial</th>
                <th class="center">Data Final</th>
                <th class="center">Status</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>

    <p class="footer">Relatório baseado na listagem exibida na tela no momento da exportacão.</p>
</body>
</html>`
}

function isValidPayload(value: unknown): value is SituationPdfPayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>
    return Array.isArray(payload.situations)
}

export async function POST(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

    try {
        const body: unknown = await request.json()

        if (!isValidPayload(body)) {
            return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 })
        }

        const html = renderHtml(body)

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
                'Content-Disposition': 'inline; filename="relatorio-situacoes.pdf"',
            },
        })
    } catch (error) {
        console.error('Erro ao gerar PDF de situacoes.', error)
        return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 })
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}
