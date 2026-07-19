'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
    onSubmit: (descricao: string) => void
}

export default function SituationTypeForm({ onSubmit }: Props) {
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
        <form className="space-y-3" onSubmit={handleSubmit}>
            <input
                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Férias, Folga, Atestado..."
                required
            />

            <button
                type="submit"
                className="primary-button rounded-xl px-5 py-3 text-sm font-semibold w-full"
            >
                Cadastrar
            </button>
        </form>
    )
}
