'use client'

import { useState } from 'react'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'
import { formatDateFromDatabase } from '@/utils/formatDate'
import type { CommissionsEmployeeResult } from '../CommissionsClient'
import { useCommissions } from '../hooks/useCommissions'

interface CommissionsReportEmployeeProps {
    result: CommissionsEmployeeResult
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

function getFilenameTimestamp(date = new Date()): string {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')

    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`
}

export default function CommissionsReportEmployee({ result }: CommissionsReportEmployeeProps) {
    const { getEmployeePeriodTitle } = useCommissions()
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

    const employeeName =
        result.data.length > 0 ? result.data[0].employeeName.toUpperCase() : 'COLABORADOR'

    const title = getEmployeePeriodTitle(employeeName, result.startDate, result.endDate)

    const totalGeneral = result.data.reduce((acc, row) => acc + row.employeeValue, 0)

    const sortedData = [...result.data].sort((a, b) => {
        const dateCompare = toDateSortKey(a.date) - toDateSortKey(b.date)
        if (dateCompare !== 0) return dateCompare

        const sectorCompare = a.sectorName.localeCompare(b.sectorName, 'pt-BR')
        if (sectorCompare !== 0) return sectorCompare

        return a.situation.localeCompare(b.situation, 'pt-BR')
    })

    async function handleGeneratePdf() {
        if (isGeneratingPdf) {
            return
        }

        setIsGeneratingPdf(true)

        try {
            const res = await fetch('/api/pdf/commissions/employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
            })

            if (!res.ok) {
                return
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)

            window.open(url, '_blank', 'noopener,noreferrer')

            const a = document.createElement('a')
            a.href = url
            const timestamp = getFilenameTimestamp()
            a.download = `relatorio-Gorjetas-${employeeName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pdf`
            a.click()

            window.setTimeout(() => {
                URL.revokeObjectURL(url)
            }, 60_000)
        } finally {
            setIsGeneratingPdf(false)
        }
    }

    return (
        <div className="panel rounded-xl border border-(--color-border) bg-surface p-6">
            {/* TÍTULO */}
            <h3 className="gold-bar-title text-(--color-primary-strong) text-lg font-semibold">
                {title}
            </h3>

            {/* RESUMO POR SETOR */}
            <h4 className="text-md font-semibold mt-6 mb-3">Resumo por Setor</h4>

            <div className="overflow-x-auto">
                <table className="min-w-175 w-full text-sm">
                    <thead>
                        <tr className="border-b border-(--color-border) bg-surface-soft">
                            <th className="py-3 px-2 text-left">Setor</th>
                            <th className="py-3 px-2 text-right">Valor Total do Setor</th>
                            <th className="py-3 px-2 text-right">Valor do Colaborador</th>
                        </tr>
                    </thead>

                    <tbody>
                        {result.sectorSummary.map((s, index) => (
                            <tr
                                key={s.sectorName}
                                className={`${index % 2 === 0 ? 'bg-[#f5f9ff]' : 'bg-white'} transition-colors hover:bg-surface-soft`}
                            >
                                <td className="py-3 px-2">{s.sectorName}</td>
                                <td className="py-3 px-2 text-right">
                                    R$ {formatCurrencyFromDatabase(s.sectorValue)}
                                </td>
                                <td className="py-3 px-2 text-right">
                                    R$ {formatCurrencyFromDatabase(s.employeeValue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* DETALHAMENTO */}
            <h4 className="text-md font-semibold mt-10 mb-3">Detalhamento das Gorjetas</h4>

            <div className="overflow-x-auto">
                <table className="min-w-225 w-full text-sm">
                    <thead>
                        <tr className="border-b border-(--color-border) bg-surface-soft">
                            <th className="py-3 px-2 text-center">Data</th>
                            <th className="py-3 px-2 text-center">Situação</th>
                            <th className="py-3 px-2 text-center">Qtde Total</th>
                            <th className="py-3 px-2 text-center">Qtde Aptos</th>
                            <th className="py-3 px-2 text-right">Gorjetas Setor</th>
                            <th className="py-3 px-2 text-right">Gorjetas Colaborador</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedData.map((d, index) => (
                            <tr
                                key={`${String(d.date)}-${d.sectorName}`}
                                className={`${index % 2 === 0 ? 'bg-[#f5f9ff]' : 'bg-white'} transition-colors hover:bg-surface-soft`}
                            >
                                <td className="py-3 px-2 text-center">
                                    {formatDateFromDatabase(d.date)}
                                </td>

                                <td className="py-3 px-2 text-center">{d.situation}</td>

                                <td className="py-3 px-2 text-center">{d.totalCount}</td>

                                <td className="py-3 px-2 text-center">{d.eligibleCount}</td>

                                <td className="py-3 px-2 text-right">
                                    R$ {formatCurrencyFromDatabase(d.sectorValue)}
                                </td>

                                <td className="py-3 px-2 text-right">
                                    R$ {formatCurrencyFromDatabase(d.employeeValue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TOTAL GERAL */}
            <div className="mt-6 text-lg font-bold">
                Total Geral: R$ {formatCurrencyFromDatabase(totalGeneral)}
            </div>

            {/* BOTÃO PDF */}
            <div className="mt-6">
                <button
                    className="primary-button px-5 py-2 rounded-xl disabled:opacity-70"
                    onClick={handleGeneratePdf}
                    disabled={isGeneratingPdf}
                >
                    {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}
                </button>
            </div>
        </div>
    )
}
