'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
    formatCurrencyInput,
    currencyToNumber,
    formatCurrencyFromDatabase,
} from '@/utils/formatCurrency'

interface SalesFormProps {
    editId: string | null
    onSave: (date: string, value: number) => Promise<void>
    onCancel: () => void
}

export function SalesForm({ editId, onSave, onCancel }: SalesFormProps) {
    const [date, setDate] = useState('')
    const [value, setValue] = useState('')

    const editMode = !!editId

    // ===========================
    // CARREGAR VENDA PARA EDIÇÃO
    // ===========================
    useEffect(() => {
        async function loadSale() {
            if (!editMode) {
                setDate('')
                setValue('')
                return
            }

            const res = await fetch(`/api/sales/${editId}`)
            const json = await res.json()

            if (!res.ok) {
                toast.error(json.error ?? 'Erro ao carregar venda.')
                return
            }

            const sale = json.sale

            setDate(sale.date.slice(0, 10)) // YYYY-MM-DD
            setValue(formatCurrencyFromDatabase(sale.value))
        }

        loadSale()
    }, [editId, editMode])

    // ===========================
    // FORMATAÇÃO DO VALOR
    // ===========================
    function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
        const formatted = formatCurrencyInput(e.target.value)
        setValue(formatted)
    }

    // ===========================
    // SALVAR
    // ===========================
    async function handleSave() {
        if (!date || !value) {
            toast.error('Informe a data e o valor.')
            return
        }

        const numericValue = currencyToNumber(value)

        if (isNaN(numericValue) || numericValue <= 0) {
            toast.error('Valor inválido. Informe um valor maior que zero.')
            return
        }

        await onSave(date, numericValue)
        setValue('')
    }

    // ===========================
    // CANCELAR
    // ===========================
    function handleCancel() {
        setDate('')
        setValue('')
        onCancel()
    }

    return (
        <div className="panel p-6 rounded-xl border border-(--color-border) bg-white">
            <h3 className="text-xl font-semibold text-(--color-primary-strong)">
                {editMode ? 'Alterar Venda' : 'Lançar Venda'}
            </h3>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Data:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="input"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Valor:</label>
                    <input
                        type="text"
                        value={value}
                        onChange={handleValueChange}
                        className="input"
                    />
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <button className="primary-button px-5 py-3 rounded-xl" onClick={handleSave}>
                    {editMode ? 'Salvar Alterações' : 'Salvar'}
                </button>

                <button className="secondary-button px-5 py-3 rounded-xl" onClick={handleCancel}>
                    Cancelar
                </button>
            </div>
        </div>
    )
}
