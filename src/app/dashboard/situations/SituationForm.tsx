'use client'

import { useState } from 'react'
import { toast } from 'sonner'

type Collaborator = {
    _id: string
    name: string
}

type SituationType = {
    _id: string
    description: string
    active: boolean
}

interface SituationFormProps {
    colaboradores: Collaborator[]
    tipos: SituationType[]
    onSubmit: (
        dataInicial: string,
        dataFinal: string,
        colaboradorId: string,
        tipoId: string,
    ) => void
}

export default function SituationForm({ colaboradores, tipos, onSubmit }: SituationFormProps) {
    const [dataInicial, setDataInicial] = useState('')
    const [dataFinal, setDataFinal] = useState('')
    const [colaboradorId, setColaboradorId] = useState('')
    const [tipoId, setTipoId] = useState('')

    function handleDataInicialChange(value: string) {
        setDataInicial(value)
        if (!dataFinal || new Date(dataFinal) < new Date(value)) {
            setDataFinal(value)
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!dataInicial || !dataFinal || !colaboradorId || !tipoId) {
            toast.error('Preencha todos os campos.')
            return
        }

        if (new Date(dataFinal) < new Date(dataInicial)) {
            toast.error('A data final não pode ser menor que a inicial.')
            return
        }

        onSubmit(dataInicial, dataFinal, colaboradorId, tipoId)

        setDataInicial('')
        setDataFinal('')
        setColaboradorId('')
        setTipoId('')

        toast.success('Situação cadastrada com sucesso!')
    }

    return (
        <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            {/* ===========================
                LINHA 1 — Datas
            ============================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-(--color-muted)">
                        Data inicial
                    </label>
                    <input
                        type="date"
                        className="date-field mt-1 h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-xs text-(--color-primary-strong)"
                        value={dataInicial}
                        onChange={(e) => handleDataInicialChange(e.target.value)}
                        required
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-(--color-muted)">
                        Data final
                    </label>
                    <input
                        type="date"
                        className="date-field mt-1 h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-xs text-(--color-primary-strong)"
                        value={dataFinal}
                        onChange={(e) => setDataFinal(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* ===========================
                LINHA 2 — Colaborador + Tipo + Botão
            ============================ */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4">
                {/* Colaborador */}
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-(--color-muted)">
                        Colaborador
                    </label>
                    <select
                        className="mt-1 h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                        value={colaboradorId}
                        onChange={(e) => setColaboradorId(e.target.value)}
                        required
                    >
                        <option value="">Selecione o colaborador</option>
                        {colaboradores.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tipo */}
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-(--color-muted)">
                        Tipo de situação
                    </label>
                    <select
                        className="mt-1 h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                        value={tipoId}
                        onChange={(e) => setTipoId(e.target.value)}
                        required
                    >
                        <option value="">Selecione o tipo</option>
                        {tipos.map((t) => (
                            <option key={t._id} value={t._id}>
                                {t.description}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Botão */}
                <div className="flex items-end">
                    <button
                        type="submit"
                        className="primary-button w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-semibold"
                    >
                        Cadastrar
                    </button>
                </div>
            </div>
        </form>
    )
}
