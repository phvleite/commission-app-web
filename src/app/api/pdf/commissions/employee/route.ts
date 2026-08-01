import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { formatCurrencyFromDatabase } from '@/app/dashboard/commissions/utils/formatCurrency'
import { formatDateFromDatabase } from '@/app/dashboard/commissions/utils/formatDate'
import { generateEmployeePeriodTitle } from '@/app/dashboard/commissions/utils/generateEmployeePeriodTitle'

export const dynamic = 'force-dynamic'

interface CommissionPayloadRow {
    date: string
    employeeName: string
    sectorName: string
    situation: string
    totalCount: number
    eligibleCount: number
    sectorValue: number
    employeeValue: number
}

interface SectorSummaryRow {
    sectorName: string
    sectorValue: number
    employeeValue: number
}

interface PdfEmployeePayload {
    startDate: string
    endDate: string
    data: CommissionPayloadRow[]
    sectorSummary: SectorSummaryRow[]
}

function getFilenameTimestamp(date = new Date()): string {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')

    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

function normalizeDateForReport(value: string): string {
    // Some payloads arrive as full ISO datetime (YYYY-MM-DDTHH:mm:ss.sssZ).
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

function renderReportEmployeeHtml(params: {
    title: string
    totalGeneral: number
    sectorSummary: SectorSummaryRow[]
    data: CommissionPayloadRow[]
}): string {
    const sectorRows = params.sectorSummary
        .map(
            (sector, index) => `
            <tr class="report-row-${index % 2 === 0 ? 'even' : 'odd'}">
                <td>${escapeHtml(sector.sectorName)}</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(sector.sectorValue)}</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(sector.employeeValue)}</td>
            </tr>`,
        )
        .join('')

    const sortedData = [...params.data].sort((a, b) => {
        const dateCompare = toDateSortKey(a.date) - toDateSortKey(b.date)
        if (dateCompare !== 0) return dateCompare

        const sectorCompare = a.sectorName.localeCompare(b.sectorName, 'pt-BR')
        if (sectorCompare !== 0) return sectorCompare

        return a.situation.localeCompare(b.situation, 'pt-BR')
    })

    const detailRows = sortedData
        .map(
            (row, index) => `
            <tr class="report-row-${index % 2 === 0 ? 'even' : 'odd'}">
                <td class="center">${escapeHtml(normalizeDateForReport(row.date))}</td>
                <td class="center">${escapeHtml(row.situation)}</td>
                <td class="center">${row.totalCount}</td>
                <td class="center">${row.eligibleCount}</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(row.sectorValue)}</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(row.employeeValue)}</td>
            </tr>`,
        )
        .join('')

    return `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relatorio de Gorjetas - Colaborador</title>
    <style>
        @page {
            size: A4;
            margin: 10mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 10px;
            color: #1b1f23;
            margin: 0;
        }
        h1, h2, h3 { margin: 0; padding: 0; }
        h1 {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.01em;
            line-height: 1.25;
            margin-bottom: 6px;
        }
        h2 {
            font-size: 11px;
            margin-top: 10px;
            margin-bottom: 4px;
        }
        .header {
            border-bottom: 2px solid #0f2c4d;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 8px;
        }
        th {
            background: #f3f6fa;
            text-align: left;
            padding: 4px 6px;
            border: 1px solid #c9d3e0;
            font-weight: 700;
            font-size: 10px;
        }
        td {
            padding: 6px 10px;
            border: 1px solid #d3dce8;
            font-size: 12px;
        }
        .right { text-align: right; }
        .center { text-align: center; }
        .report-row-even td { background: #f5f9ff; }
        .report-row-odd td { background: #ffffff; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="center">${escapeHtml(params.title)}</h1>
    </div>

    <h2>Resumo por Setor</h2>
    <table>
        <thead>
            <tr>
                <th>Setor</th>
                <th class="right">Valor Total do Setor</th>
                <th class="right">Valor do Colaborador</th>
            </tr>
        </thead>
        <tbody>
            ${sectorRows}
        </tbody>
    </table>

    <h2>Detalhamento das Gorjetas</h2>
    <table>
        <thead>
            <tr>
                <th class="center">Data</th>
                <th class="center">Situacao</th>
                <th class="center">Qtde Colab.</th>
                <th class="center">Qtde Aptos</th>
                <th class="right">Gorjetas Setor</th>
                <th class="right">Gorjetas Colaborador</th>
            </tr>
        </thead>
        <tbody>
            ${detailRows}
        </tbody>
    </table>

    <h2>Total Geral: R$ ${formatCurrencyFromDatabase(params.totalGeneral)}</h2>
</body>
</html>`
}

function isValidPayload(value: unknown): value is PdfEmployeePayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>

    return (
        typeof payload.startDate === 'string' &&
        typeof payload.endDate === 'string' &&
        Array.isArray(payload.data) &&
        Array.isArray(payload.sectorSummary)
    )
}

export async function POST(req: Request) {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

    try {
        const body: unknown = await req.json()
        if (!isValidPayload(body)) {
            return NextResponse.json(
                { error: 'Payload inválido para geração de PDF.' },
                { status: 400 },
            )
        }

        const { startDate, endDate, data, sectorSummary } = body

        const employeeName = data.length > 0 ? String(data[0].employeeName) : 'COLABORADOR'
        const totalGeneral = data.reduce((acc, row) => acc + row.employeeValue, 0)
        const title = generateEmployeePeriodTitle(employeeName.toUpperCase(), startDate, endDate)

        const html = renderReportEmployeeHtml({
            title,
            totalGeneral,
            sectorSummary,
            data,
        })

        browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()

        await page.setContent(html, { waitUntil: 'load' })

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm',
            },
        })

        const pdfArrayBuffer = new ArrayBuffer(pdfBuffer.byteLength)
        new Uint8Array(pdfArrayBuffer).set(pdfBuffer)
        const filenameTimestamp = getFilenameTimestamp()
        const filename = `relatorio-colaborador-${filenameTimestamp}.pdf`

        return new Response(pdfArrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 })
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}
