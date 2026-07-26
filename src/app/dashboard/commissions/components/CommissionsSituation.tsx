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

    const sortedSituations = [...situations].sort((a, b) => {
        const aDate = a.date.includes('T') ? a.date.split('T')[0] : a.date
        const bDate = b.date.includes('T') ? b.date.split('T')[0] : b.date

        if (aDate !== bDate) return aDate.localeCompare(bDate, 'pt-BR')

        const sectorCompare = a.sectorName.localeCompare(b.sectorName, 'pt-BR')
        if (sectorCompare !== 0) return sectorCompare

        return a.employeeName.localeCompare(b.employeeName, 'pt-BR')
    })

    const processed = sortedSituations.map((s, index, array) => {
        const formattedDate = formatDateFromDatabase(
            s.date.includes('T') ? s.date.split('T')[0] : s.date,
        )
        const previous = array[index - 1]
        const previousFormattedDate = previous
            ? formatDateFromDatabase(
                  previous.date.includes('T') ? previous.date.split('T')[0] : previous.date,
              )
            : ''

        const showDate = formattedDate !== previousFormattedDate ? formattedDate : ''

        return {
            ...s,
            showDate,
        }
    })

    return (
        <div className="panel mt-10 rounded-xl border border-(--color-border) bg-surface p-6">
            <h3 className="gold-bar-title text-(--color-primary-strong) text-lg font-semibold">
                Situações do Período
            </h3>

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
                        {processed.map((s) => (
                            <tr
                                key={`${s.date}-${s.employeeName}-${s.sectorName}`}
                                className="border-b border-(--color-border) transition-colors hover:bg-surface-soft"
                            >
                                <td className="py-3 px-2 text-center font-semibold">
                                    {s.showDate}
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
