'use client'

import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'
import { formatDateFromDatabase } from '@/utils/formatDate'
import type { CommissionRow, SectorSummaryRow } from '../CommissionsClient'
import { useCommissions } from '../hooks/useCommissions'

interface CommissionsReportEmployeeProps {
    result: {
        startDate: string
        endDate: string
        data: CommissionRow[]
        sectorSummary: Array<SectorSummaryRow & { employeeValue: number }>
    }
}

export default function CommissionsReportEmployee({ result }: CommissionsReportEmployeeProps) {
    const { getEmployeePeriodTitle } = useCommissions()

    const employeeName =
        result.data.length > 0 ? result.data[0].employeeName.toUpperCase() : 'COLABORADOR'

    const title = getEmployeePeriodTitle(employeeName, result.startDate, result.endDate)

    const totalGeneral = result.data.reduce((acc, row) => acc + row.employeeValue, 0)

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
                        {result.sectorSummary.map((s) => (
                            <tr
                                key={s.sectorName}
                                className="border-b border-(--color-border) transition-colors hover:bg-surface-soft"
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
            <h4 className="text-md font-semibold mt-10 mb-3">Detalhamento das Comissões</h4>

            <div className="overflow-x-auto">
                <table className="min-w-225 w-full text-sm">
                    <thead>
                        <tr className="border-b border-(--color-border) bg-surface-soft">
                            <th className="py-3 px-2 text-center">Data</th>
                            <th className="py-3 px-2 text-center">Situação</th>
                            <th className="py-3 px-2 text-center">Qtde Total</th>
                            <th className="py-3 px-2 text-center">Qtde Aptos</th>
                            <th className="py-3 px-2 text-right">Comissão Setor</th>
                            <th className="py-3 px-2 text-right">Comissão Colaborador</th>
                        </tr>
                    </thead>

                    <tbody>
                        {result.data.map((d) => (
                            <tr
                                key={`${String(d.date)}-${d.sectorName}`}
                                className="border-b border-(--color-border) transition-colors hover:bg-surface-soft"
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
                <button className="primary-button px-5 py-2 rounded-xl">Gerar PDF</button>
            </div>
        </div>
    )
}
