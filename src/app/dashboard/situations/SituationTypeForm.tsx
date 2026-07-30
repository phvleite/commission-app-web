'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
    onSubmit: (descricao: string) => void
    isSubmitting?: boolean
}

export default function SituationTypeForm({ onSubmit, isSubmitting = false }: Props) {
    const [descricao, setDescricao] = useState('')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!descricao.trim()) {
            toast.error('Informe a descrição da situação.')
            return
        }

        onSubmit(descricao.trim())
        setDescricao('')

        toast.success('Tipo de situação cadastrado!')
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Label + Input */}
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-(--color-muted)">Descrição</label>

                <input
                    className="mt-1 h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong)"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Férias, Folga, Atestado..."
                    required
                />
            </div>

            {/* Botão */}
            <button
                type="submit"
                className="primary-button w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-70"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Processando...' : 'Cadastrar'}
            </button>
        </form>
    )
}
