'use client'

import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'
import type { CommissionsAllResult } from '../CommissionsClient'
import { useCommissions } from '../hooks/useCommissions'

interface CommissionsReportAllProps {
    result: CommissionsAllResult
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

export default function CommissionsReportAll({ result }: CommissionsReportAllProps) {
    const { getPeriodTitle, groupByEmployee, calculateTotal } = useCommissions()

    const title = getPeriodTitle(result.startDate, result.endDate)

    const groupedEmployees = groupByEmployee(result.data)
    const totalGeneral = calculateTotal(result.data)

    const totalSales = result.salesSummary.reduce((acc, v) => acc + v.value, 0)
    const totalSalesCommission = result.salesSummary.reduce(
        (acc, v) => acc + v.totalCommissionValue,
        0,
    )

    const totalSectors = result.sectorSummary.reduce((acc, s) => acc + s.sectorValue, 0)

    const totalSectorsWithoutMerit = result.sectorSummary
        .filter((s) => s.sectorName.toUpperCase() !== 'MERITOCRACIA')
        .reduce((acc, s) => acc + s.sectorValue, 0)

    async function handleGeneratePdf() {
        const res = await fetch('/api/pdf/commissions/all', {
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
        a.download = `relatorio-geral-${timestamp}.pdf`
        a.click()

        window.setTimeout(() => {
            URL.revokeObjectURL(url)
        }, 60_000)
    }

    return (
        <div className="panel rounded-xl border border-(--color-border) bg-surface p-6">
            {/* TÍTULO */}
            <h3 className="gold-bar-title text-(--color-primary-strong) text-lg font-semibold">
                {title}
            </h3>

            <div className="mt-6 space-y-4">
                {/* VALORES DO PERÍODO */}
                <div className="flex flex-col gap-1">
                    <strong>Valor total das vendas:</strong>
                    <span>R$ {formatCurrencyFromDatabase(totalSales)}</span>
                </div>

                <div className="flex flex-col gap-1">
                    <strong>Comissão total do período:</strong>
                    <span>R$ {formatCurrencyFromDatabase(totalSalesCommission)}</span>
                </div>
            </div>

            <hr className="my-6 border-(--color-border)" />

            {/* RESUMO POR SETOR */}
            <h4 className="text-md font-semibold mb-3">Resumo por Setor</h4>

            <div className="overflow-x-auto">
                <table className="min-w-150 w-full text-sm">
                    <thead>
                        <tr className="border-b border-(--color-border) bg-surface-soft">
                            <th className="py-3 px-2 text-left">Setor</th>
                            <th className="py-3 px-2 text-right">Valor Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {result.sectorSummary.map((s) => (
                            <tr
                                key={s.sectorName}
                                className="border-b border-(--color-border) transition-colors hover:bg-surface-soft"
                            >
                                <td className="py-3 px-2">{s.sectorName}</td>
                                <td className="py-3 px-2 text-right">
                                    R$ {formatCurrencyFromDatabase(s.sectorValue)}
                                </td>
                            </tr>
                        ))}

                        {/* TOTAL DOS SETORES */}
                        <tr className="font-semibold">
                            <td className="py-3 px-2">Total dos Setores</td>
                            <td className="py-3 px-2 text-right">
                                R$ {formatCurrencyFromDatabase(totalSectors)}
                            </td>
                        </tr>

                        {/* TOTAL SEM MERITOCRACIA */}
                        <tr className="font-semibold">
                            <td className="py-3 px-2">Total dos Setores (sem meritocracia)</td>
                            <td className="py-3 px-2 text-right">
                                R$ {formatCurrencyFromDatabase(totalSectorsWithoutMerit)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <hr className="my-6 border-(--color-border)" />

            {/* COMISSÕES POR COLABORADOR */}
            <h4 className="text-md font-semibold mb-3">Comissões por Colaborador</h4>

            <div className="overflow-x-auto">
                <table className="min-w-150 w-full text-sm">
                    <thead>
                        <tr className="border-b border-(--color-border) bg-surface-soft">
                            <th className="py-3 px-2 text-left">Colaborador</th>
                            <th className="py-3 px-2 text-left">Setor</th>
                            <th className="py-3 px-2 text-right">Total no Período</th>
                        </tr>
                    </thead>

                    <tbody>
                        {groupedEmployees.map((emp) => (
                            <tr
                                key={`${emp.employeeName}-${emp.sectorName}`}
                                className="border-b border-(--color-border) transition-colors hover:bg-surface-soft"
                            >
                                <td className="py-3 px-2">{emp.employeeName}</td>
                                <td className="py-3 px-2">{emp.sectorName}</td>
                                <td className="py-3 px-2 text-right">
                                    R$ {formatCurrencyFromDatabase(emp.totalCommission)}
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
                <button className="primary-button px-5 py-2 rounded-xl" onClick={handleGeneratePdf}>
                    Gerar PDF
                </button>
            </div>
        </div>
    )
}
