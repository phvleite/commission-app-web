// app/api/pdf/commissions/all/route.ts

import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { formatCurrencyFromDatabase } from '@/app/dashboard/commissions/utils/formatCurrency'
import { generatePeriodTitle } from '@/app/dashboard/commissions/utils/generatePeriodTitle'
import { formatDateFromDatabase } from '@/app/dashboard/commissions/utils/formatDate'

export const dynamic = 'force-dynamic'

interface CommissionPayloadRow {
    employeeName: string
    sectorName: string
    employeeValue: number
}

interface SectorSummaryRow {
    sectorName: string
    sectorValue: number
}

interface SalesSummaryRow {
    value: number
    totalCommissionValue: number
}

interface PdfAllPayload {
    startDate: string
    endDate: string
    data: CommissionPayloadRow[]
    sectorSummary: SectorSummaryRow[]
    salesSummary: SalesSummaryRow[]
    situations?: SituationPayloadRow[]
}

interface GroupedEmployeeRow {
    employeeName: string
    sectorName: string
    totalCommission: number
}

interface SituationPayloadRow {
    date: string
    employeeName: string
    sectorName: string
    totalCount: number
    eligibleCount: number
    situation: string
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
    const baseDate = value.includes('T') ? value.split('T')[0] : value
    return formatDateFromDatabase(baseDate)
}

function getDateSortKey(value: string): string {
    return value.includes('T') ? value.split('T')[0] : value
}

function renderReportAllHtml(params: {
    title: string
    totalSales: number
    totalSalesCommission: number
    totalSectors: number
    totalSectorsWithoutMerit: number
    totalGeneral: number
    sectorSummary: SectorSummaryRow[]
    groupedEmployees: GroupedEmployeeRow[]
    situations: SituationPayloadRow[]
}): string {
    const sectorRows = params.sectorSummary
        .map(
            (sector, index) => `
            <tr class="report-row-${index % 2 === 0 ? 'even' : 'odd'}">
                <td>${escapeHtml(sector.sectorName)}</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(sector.sectorValue)}</td>
            </tr>`,
        )
        .join('')

    const employeeRows = params.groupedEmployees
        .map(
            (employee, index) => `
            <tr class="report-row-${index % 2 === 0 ? 'even' : 'odd'}">
                <td>${escapeHtml(employee.employeeName)}</td>
                <td>${escapeHtml(employee.sectorName)}</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(employee.totalCommission)}</td>
            </tr>`,
        )
        .join('')

    const sortedSituations = [...params.situations].sort((a, b) => {
        const aDate = getDateSortKey(a.date)
        const bDate = getDateSortKey(b.date)

        if (aDate !== bDate) return aDate.localeCompare(bDate, 'pt-BR')

        const sectorCompare = a.sectorName.localeCompare(b.sectorName, 'pt-BR')
        if (sectorCompare !== 0) return sectorCompare

        return a.employeeName.localeCompare(b.employeeName, 'pt-BR')
    })

    const hasSituations = sortedSituations.length > 0
    let previousDate = ''
    let dateGroupIndex = -1
    const situationRows = sortedSituations
        .map((situation, index, array) => {
            const dateValue = normalizeDateForReport(situation.date)
            const isNewDate = dateValue !== previousDate
            const nextDateValue =
                index < array.length - 1 ? normalizeDateForReport(array[index + 1].date) : ''
            const isGroupEnd = dateValue !== nextDateValue

            if (isNewDate) {
                dateGroupIndex += 1
            }

            const rowToneClass =
                dateGroupIndex % 2 === 0 ? 'situation-group-even' : 'situation-group-odd'
            const rowStartClass = isNewDate ? 'situation-group-start-row' : ''
            const rowEndClass = isGroupEnd ? 'situation-group-end-row' : ''
            const dateCellClass = isNewDate ? 'situation-date-label' : 'situation-date-empty'
            previousDate = dateValue

            return `
            <tr class="${rowToneClass} ${rowStartClass} ${rowEndClass}">
                <td class="center ${dateCellClass}"><strong>${isNewDate ? escapeHtml(dateValue) : ''}</strong></td>
                <td>${escapeHtml(situation.employeeName)}</td>
                <td>${escapeHtml(situation.sectorName)}</td>
                <td class="center">${escapeHtml(situation.situation)}</td>
                <td class="center">${situation.totalCount}</td>
                <td class="center">${situation.eligibleCount}</td>
            </tr>`
        })
        .join('')

    return `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relatorio Geral de Comissoes</title>
    <style>
        @page {
            size: A4;
            margin: 20mm 15mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            color: #1b1f23;
            margin: 0;
        }
        h1, h2, h3 { margin: 0; padding: 0; }
        h1 { font-size: 22px; letter-spacing: 0.02em; }
        h2 { font-size: 15px; margin-top: 18px; margin-bottom: 6px; }
        h3 { font-size: 12px; color: #555; }
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
            margin-bottom: 16px;
        }
        th {
            background: #f3f6fa;
            text-align: left;
            padding: 7px;
            border: 1px solid #c9d3e0;
            font-weight: 700;
        }
        td {
            padding: 7px;
            border: 1px solid #d3dce8;
        }
        .right { text-align: right; }
        .center { text-align: center; }
        .report-row-even td { background: #f5f9ff; }
        .report-row-odd td { background: #ffffff; }
        .total td {
            font-weight: 700;
            background: #d2e2f6 !important;
            color: #0f2c4d;
        }
        .situation-table tbody tr.situation-group-even td { background: #f5f9ff; }
        .situation-table tbody tr.situation-group-odd td { background: #ffffff; }
        .situation-table tbody tr.situation-group-start-row td { border-top: 2.5px solid #4f6f92; }
        .situation-table tbody tr.situation-group-end-row td { border-bottom: 2.5px solid #4f6f92; }
        .situation-table tbody td {
            border-top: 0;
            border-bottom: 0;
        }
        .situation-table td.situation-date-label {
            font-weight: 700;
        }
        .situation-table td.situation-date-empty {
            color: transparent;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="center">${escapeHtml(params.title)}</h1>
    </div>

    <div class="summary">
        <div><strong>Valor total das vendas:</strong> R$ ${formatCurrencyFromDatabase(params.totalSales)}</div>
        <div><strong>Comissao total do periodo:</strong> R$ ${formatCurrencyFromDatabase(params.totalSalesCommission)}</div>
    </div>

    <h2 class="center">Resumo por Setor</h2>
    <table>
        <thead>
            <tr>
                <th class="center">Setor</th>
                <th class="center">Valor Total</th>
            </tr>
        </thead>
        <tbody>
            ${sectorRows}
            <tr class="total">
                <td>Total dos Setores</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(params.totalSectors)}</td>
            </tr>
            <tr class="total">
                <td>Total dos Setores (sem meritocracia)</td>
                <td class="right">R$ ${formatCurrencyFromDatabase(params.totalSectorsWithoutMerit)}</td>
            </tr>
        </tbody>
    </table>

    <h2 class="center">Comissoes por Colaborador</h2>
    <table>
        <thead>
            <tr>
                <th class="center">Colaborador</th>
                <th class="center">Setor</th>
                <th class="center">Total no Periodo</th>
            </tr>
        </thead>
        <tbody>
            ${employeeRows}
        </tbody>
    </table>

    <h2>Total Geral: R$ ${formatCurrencyFromDatabase(params.totalGeneral)}</h2>

    ${
        hasSituations
            ? `
    <h2 class="center">Situacoes do Periodo</h2>
    <table class="situation-table">
        <thead>
            <tr>
                <th class="center">Data</th>
                <th class="center">Colaborador</th>
                <th class="center">Setor</th>
                <th class="center">Situacao</th>
                <th class="center">Qtde Total</th>
                <th class="center">Qtde Aptos</th>
            </tr>
        </thead>
        <tbody>
            ${situationRows}
        </tbody>
    </table>`
            : ''
    }
</body>
</html>`
}

function isValidPayload(value: unknown): value is PdfAllPayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>
    return (
        typeof payload.startDate === 'string' &&
        typeof payload.endDate === 'string' &&
        Array.isArray(payload.data) &&
        Array.isArray(payload.sectorSummary) &&
        Array.isArray(payload.salesSummary)
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

        const { startDate, endDate, data, sectorSummary, salesSummary } = body
        const { situations = [] } = body

        const totalSectors = sectorSummary.reduce((acc, sector) => acc + sector.sectorValue, 0)
        const totalSectorsWithoutMerit = sectorSummary
            .filter((sector) => sector.sectorName.toUpperCase() !== 'MERITOCRACIA')
            .reduce((acc, sector) => acc + sector.sectorValue, 0)

        const groupedEmployees = Object.values(
            data.reduce<Record<string, GroupedEmployeeRow>>((acc, row) => {
                const key = row.employeeName
                if (!acc[key]) {
                    acc[key] = {
                        employeeName: row.employeeName,
                        sectorName: row.sectorName,
                        totalCommission: 0,
                    }
                }
                acc[key].totalCommission += row.employeeValue
                return acc
            }, {}),
        ).sort(
            (a, b) =>
                a.employeeName.localeCompare(b.employeeName, 'pt-BR') ||
                a.sectorName.localeCompare(b.sectorName, 'pt-BR'),
        )

        const totalGeneral = groupedEmployees.reduce(
            (acc, employee) => acc + employee.totalCommission,
            0,
        )

        const totalSales = salesSummary.reduce((acc, sale) => acc + sale.value, 0)
        const totalSalesCommission = salesSummary.reduce(
            (acc, sale) => acc + sale.totalCommissionValue,
            0,
        )
        const title = generatePeriodTitle(startDate, endDate)

        const html = renderReportAllHtml({
            title,
            totalSales,
            totalSalesCommission,
            totalSectors,
            totalSectorsWithoutMerit,
            totalGeneral,
            sectorSummary,
            groupedEmployees,
            situations,
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
        const filename = `relatorio-geral-${filenameTimestamp}.pdf`

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
