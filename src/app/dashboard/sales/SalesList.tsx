'use client'

import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'
import { formatDateFromDatabase } from '@/utils/formatDate'

interface SalesListProps {
    sales: Array<{
        _id: string
        date: string
        value: number
        totalCommissionValue: number
    }>
    onEdit: (id: string) => void
    onOpenModal: (date: string) => void
    onRecalc?: (date: string) => void
    isLoading?: boolean
}

export function SalesList({
    sales,
    onEdit,
    onOpenModal,
    onRecalc,
    isLoading = false,
}: SalesListProps) {
    if (isLoading) {
        return (
            <div className="panel p-6 rounded-xl border border-(--color-border) bg-surface">
                <h3 className="gold-bar-title text-lg font-semibold text-(--color-primary-strong)">
                    Histórico de Vendas
                </h3>

                <div className="mt-6 rounded-xl border border-dashed border-(--color-border) bg-surface-soft p-6 text-center text-sm text-(--color-primary-weak)">
                    Carregando vendas...
                </div>
            </div>
        )
    }

    if (sales.length === 0) {
        return (
            <div className="panel p-6 rounded-xl border border-(--color-border) bg-surface">
                <h3 className="gold-bar-title text-lg font-semibold text-(--color-primary-strong)">
                    Histórico de Vendas
                </h3>

                <div className="mt-6 rounded-xl border border-dashed border-(--color-border) bg-surface-soft p-6 text-center text-sm text-(--color-primary-weak)">
                    Nenhuma venda encontrada para o período selecionado.
                </div>
            </div>
        )
    }

    return (
        <div className="panel p-6 rounded-xl border border-(--color-border) bg-surface">
            <h3 className="gold-bar-title text-lg font-semibold text-(--color-primary-strong)">
                Histórico de Vendas
            </h3>

            {/* WRAPPER RESPONSIVO */}
            <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm min-w-150">
                    <thead>
                        <tr className="border-b border-(--color-border) bg-surface-soft">
                            <th className="py-3 px-2 text-center">Data</th>
                            <th className="py-3 px-2 text-center">Valor da Venda</th>
                            <th className="py-3 px-2 text-center">Comissão Total</th>
                            <th className="py-3 px-2 text-center">Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sales.map((sale) => (
                            <tr
                                key={sale._id}
                                className="border-b border-(--color-border) hover:bg-surface-soft transition-colors"
                            >
                                <td className="py-3 px-2 text-center">
                                    {formatDateFromDatabase(sale.date)}
                                </td>

                                <td className="py-3 px-2 text-right">
                                    R$ {formatCurrencyFromDatabase(sale.value)}
                                </td>

                                <td className="py-3 px-2 text-right">
                                    R$ {formatCurrencyFromDatabase(sale.totalCommissionValue)}
                                </td>

                                <td className="py-3 px-2">
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        <button
                                            className="primary-button px-4 py-2 rounded-xl"
                                            onClick={() => onOpenModal(sale.date)}
                                        >
                                            Ver Setores
                                        </button>

                                        <button
                                            className="secondary-button px-4 py-2 rounded-xl"
                                            onClick={() => onEdit(sale._id)}
                                        >
                                            Alterar
                                        </button>

                                        {onRecalc && (
                                            <button
                                                className="px-4 py-2 rounded-xl bg-green-600 text-white"
                                                onClick={() => onRecalc(sale.date)}
                                            >
                                                Recalcular
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
