'use client'

import { formatDateFromDatabase } from '@/utils/formatDate'

interface CommissionsSituationsProps {
    situations: Array<{
        date: string
        employeeName: string
        sectorName: string
        totalCount: number
        eligibleCount: number
        situation: string
    }>
}

export default function CommissionsSituations({ situations }: CommissionsSituationsProps) {
    if (!situations || situations.length === 0) {
        return (
            <div className="panel mt-10 rounded-xl border border-(--color-border) bg-surface p-6">
                <h3 className="gold-bar-title text-(--color-primary-strong) text-lg font-semibold">
                    Situações do Período
                </h3>

                <p className="mt-4 text-(--color-muted) text-sm">
                    Nenhuma situação registrada no período.
                </p>
            </div>
        )
    }

    return (
        <div className="panel mt-10 rounded-xl border border-(--color-border) bg-surface p-6">
            {/* TÍTULO */}
            <h3 className="gold-bar-title text-(--color-primary-strong) text-lg font-semibold">
                Situações do Período
            </h3>

            {/* TABELA */}
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-225 w-full text-sm">
                    <thead>
                        <tr className="border-b border-(--color-border) bg-surface-soft">
                            <th className="py-3 px-2 text-center">Data</th>
                            <th className="py-3 px-2 text-left">Colaborador</th>
                            <th className="py-3 px-2 text-left">Setor</th>
                            <th className="py-3 px-2 text-center">Situação</th>
                            <th className="py-3 px-2 text-center">Qtde Total</th>
                            <th className="py-3 px-2 text-center">Qtde Aptos</th>
                        </tr>
                    </thead>

                    <tbody>
                        {situations.map((s) => (
                            <tr
                                key={`${String(s.date)}-${s.employeeName}-${s.sectorName}`}
                                className="border-b border-(--color-border) transition-colors hover:bg-surface-soft"
                            >
                                <td className="py-3 px-2 text-center">
                                    {formatDateFromDatabase(s.date)}
                                </td>

                                <td className="py-3 px-2">{s.employeeName}</td>

                                <td className="py-3 px-2">{s.sectorName}</td>

                                <td className="text-(--color-danger) py-3 px-2 text-center font-semibold">
                                    {s.situation}
                                </td>

                                <td className="py-3 px-2 text-center">{s.totalCount}</td>

                                <td className="py-3 px-2 text-center">{s.eligibleCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
