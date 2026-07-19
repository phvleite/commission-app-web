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
}

export function SalesList({ sales, onEdit, onOpenModal }: SalesListProps) {
    return (
        <div className="panel p-6 rounded-xl border border-(--color-border) bg-white">

            <h3 className="text-lg font-semibold text-(--color-primary-strong)">
                Histórico de Vendas
            </h3>

            {/* Cabeçalho */}
            <div className="mt-6 grid grid-cols-4 gap-4 font-medium text-sm text-(--color-primary-strong)">
                <span>Data</span>
                <span>Valor da Venda</span>
                <span>Comissão Total</span>
                <span>Ações</span>
            </div>

            {/* Lista */}
            <div className="mt-4 space-y-3">
                {sales.map((sale) => (
                    <div
                        key={sale._id}
                        className="grid grid-cols-4 gap-4 items-center p-4 rounded-lg border border-(--color-border) bg-(--color-bg-soft)"
                    >
                        <span>{formatDateFromDatabase(sale.date)}</span>

                        <span>R$ {formatCurrencyFromDatabase(sale.value)}</span>

                        <span>R$ {formatCurrencyFromDatabase(sale.totalCommissionValue)}</span>

                        <div className="flex gap-3">
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
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
