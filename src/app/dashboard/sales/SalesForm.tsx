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
    isSaving?: boolean
}

export function SalesForm({
    editId,
    onSave,
    onCancel,
    isSaving: externalIsSaving,
}: SalesFormProps) {
    const [date, setDate] = useState('')
    const [value, setValue] = useState('')
    const [localIsSaving, setLocalIsSaving] = useState(false)
    const [feedback, setFeedback] = useState<{
        type: 'info' | 'success' | 'error'
        message: string
    } | null>(null)

    const isSaving = externalIsSaving ?? localIsSaving

    const editMode = !!editId

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

            setDate(sale.date.slice(0, 10))
            setValue(formatCurrencyFromDatabase(sale.value))
        }

        loadSale()
    }, [editId, editMode])

    function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
        const formatted = formatCurrencyInput(e.target.value)
        setValue(formatted)
    }

    async function handleSave() {
        if (!date || !value) {
            setFeedback({ type: 'error', message: 'Informe a data e o valor.' })
            toast.error('Informe a data e o valor.')
            return
        }

        const numericValue = currencyToNumber(value)

        if (isNaN(numericValue) || numericValue <= 0) {
            setFeedback({
                type: 'error',
                message: 'Valor inválido. Informe um valor maior que zero.',
            })
            toast.error('Valor inválido. Informe um valor maior que zero.')
            return
        }

        setLocalIsSaving(true)
        setFeedback({
            type: 'info',
            message: editMode ? 'Salvando alterações da venda...' : 'Salvando nova venda...',
        })

        try {
            await onSave(date, numericValue)
            setValue('')
            setFeedback({
                type: 'success',
                message: editMode ? 'Venda atualizada com sucesso.' : 'Venda lançada com sucesso.',
            })
            toast.success(editMode ? 'Venda atualizada com sucesso!' : 'Venda lançada com sucesso!')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao salvar venda.'
            setFeedback({ type: 'error', message })
            toast.error(message)
        } finally {
            setLocalIsSaving(false)
        }
    }

    function handleCancel() {
        setDate('')
        setValue('')
        setFeedback(null)
        onCancel()
    }

    return (
        <div className="panel p-6 rounded-xl border border-(--color-border) bg-surface mb-6">
            <h3 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                {editMode ? 'Alterar Venda' : 'Lançar Venda'}
            </h3>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Data:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border border-(--color-border) rounded-xl p-3 bg-surface-soft"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Valor:</label>
                    <input
                        type="text"
                        value={value}
                        onChange={handleValueChange}
                        className="w-full border border-(--color-border) rounded-xl p-3 bg-surface-soft"
                    />
                </div>
            </div>

            {feedback ? (
                <p
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                        feedback.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : feedback.type === 'error'
                              ? 'border-red-200 bg-red-50 text-(--color-danger)'
                              : 'border-amber-200 bg-amber-50 text-amber-900'
                    }`}
                >
                    {feedback.message}
                </p>
            ) : null}

            <div className="mt-6 flex gap-3">
                <button
                    className="primary-button px-5 py-3 rounded-xl disabled:opacity-70"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Processando...' : editMode ? 'Salvar Alterações' : 'Salvar'}
                </button>

                <button className="cancel-button px-5 py-3 rounded-xl" onClick={handleCancel}>
                    Cancelar
                </button>
            </div>
        </div>
    )
}
