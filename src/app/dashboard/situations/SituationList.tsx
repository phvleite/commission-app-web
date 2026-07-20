'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Situation {
    _id: string
    employeeId: string
    employeeName: string | null
    typeId: string
    typeDescription: string | null
    startDate: string
    endDate: string
    active: boolean
}

interface Collaborator {
    _id: string
    name: string
}

interface SituationType {
    _id: string
    description: string
    active: boolean
}

interface Props {
    situacoes: Situation[]
    colaboradores: Collaborator[]
    tipos: SituationType[]
    onEditar: (
        id: string,
        dataInicial: string,
        dataFinal: string,
        colaboradorId: string,
        tipoId: string,
    ) => void
    onAtivar: (id: string) => void
    onInativar: (id: string) => void
}

export default function SituationList({
    situacoes,
    colaboradores,
    tipos,
    onEditar,
    onAtivar,
    onInativar,
}: Props) {
    const [editId, setEditId] = useState<string | null>(null)
    const [editDataInicial, setEditDataInicial] = useState('')
    const [editDataFinal, setEditDataFinal] = useState('')
    const [editColaborador, setEditColaborador] = useState('')
    const [editTipo, setEditTipo] = useState('')

    function iniciarEdicao(s: Situation) {
        setEditId(s._id)
        setEditDataInicial(s.startDate)
        setEditDataFinal(s.endDate)
        setEditColaborador(s.employeeId)
        setEditTipo(s.typeId)
    }

    function salvar() {
        if (!editDataInicial || !editDataFinal || !editColaborador || !editTipo) {
            toast.error('Preencha todos os campos.')
            return
        }

        if (new Date(editDataFinal) < new Date(editDataInicial)) {
            toast.error('A data final não pode ser menor que a inicial.')
            return
        }

        onEditar(editId!, editDataInicial, editDataFinal, editColaborador, editTipo)
        setEditId(null)
        toast.success('Situação atualizada!')
    }

    function formatarData(data: string) {
        if (!data) return ''
        const [ano, mes, dia] = data.split('-')
        return `${dia}/${mes}/${ano}`
    }

    return (
        <div className="mt-6 space-y-3">
            {situacoes.map((s) => {
                const isEditing = editId === s._id
                const isGold = s.typeDescription === 'Folga' || s.typeDescription === 'Férias'

                return (
                    <div
                        key={s._id}
                        className={`${isGold ? 'gold-bar-title' : 'danger-bar-title'} rounded-xl border border-(--color-border) bg-white p-4 space-y-3`}
                    >
                        {/* ===========================
                            MODO NORMAL
                        ============================ */}
                        {!isEditing && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-(--color-primary-strong)">
                                        {s.employeeName || '-'}
                                    </p>

                                    <p className="text-xs text-(--color-muted)">
                                        Tipo: {s.typeDescription || '-'}
                                    </p>

                                    <p className="text-[11px] text-(--color-muted)">
                                        {formatarData(s.startDate)} até {formatarData(s.endDate)}
                                    </p>

                                    <p className="text-xs text-(--color-muted)">
                                        Status: {s.active ? 'Ativo' : 'Inativo'}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        type="button"
                                        className="primary-button w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={() => iniciarEdicao(s)}
                                    >
                                        Editar
                                    </button>

                                    {s.active ? (
                                        <button
                                            type="button"
                                            className="cancel-button w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-semibold"
                                            onClick={() => onInativar(s._id)}
                                        >
                                            Inativar
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="cancel-button w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-semibold"
                                            onClick={() => onAtivar(s._id)}
                                        >
                                            Ativar
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===========================
                            MODO EDIÇÃO INLINE
                        ============================ */}
                        {isEditing && (
                            <div className="space-y-3">
                                {/* Inputs com labels */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                                    {/* Data inicial */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Data inicial
                                        </label>
                                        <input
                                            type="date"
                                            className="date-field mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-white px-3 text-xs"
                                            value={editDataInicial}
                                            onChange={(e) => setEditDataInicial(e.target.value)}
                                        />
                                    </div>

                                    {/* Data final */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Data final
                                        </label>
                                        <input
                                            type="date"
                                            className="date-field mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-white px-3 text-xs"
                                            value={editDataFinal}
                                            onChange={(e) => setEditDataFinal(e.target.value)}
                                        />
                                    </div>

                                    {/* Colaborador */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Colaborador
                                        </label>
                                        <select
                                            className="mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                                            value={editColaborador}
                                            onChange={(e) => setEditColaborador(e.target.value)}
                                        >
                                            {colaboradores.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Tipo */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Tipo
                                        </label>
                                        <select
                                            className="mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                                            value={editTipo}
                                            onChange={(e) => setEditTipo(e.target.value)}
                                        >
                                            {tipos.map((t) => (
                                                <option key={t._id} value={t._id}>
                                                    {t.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Botões */}
                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <button
                                        type="button"
                                        className="primary-button w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={salvar}
                                    >
                                        Salvar
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-button w-full sm:w-auto rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={() => setEditId(null)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
