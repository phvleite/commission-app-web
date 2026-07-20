'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface SituationType {
    _id: string
    description: string
    active: boolean
}

interface Props {
    tipos: SituationType[]
    onEditar: (id: string, descricao: string) => void
    onAtivar: (id: string) => void
    onInativar: (id: string) => void
}

export default function SituationTypeList({
    tipos,
    onEditar,
    onAtivar,
    onInativar,
}: Props) {
    const [editId, setEditId] = useState<string | null>(null)
    const [editDescricao, setEditDescricao] = useState('')

    function iniciarEdicao(id: string, descricao: string) {
        setEditId(id)
        setEditDescricao(descricao)
    }

    function salvar() {
        if (!editDescricao.trim()) {
            toast.error('Informe a descrição.')
            return
        }

        onEditar(editId!, editDescricao.trim())
        setEditId(null)
        toast.success('Tipo de situação atualizado!')
    }

    return (
        <div className="mt-4 space-y-3">
            {tipos.map((t) => {
                const isEditing = editId === t._id

                return (
                    <div
                        key={t._id}
                        className="gold-bar-title rounded-xl border border-(--color-border) bg-white p-4 space-y-3"
                    >
                        {/* ===========================
                            MODO NORMAL
                        ============================ */}
                        {!isEditing && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <p className="text-sm font-semibold text-(--color-primary-strong)">
                                    {t.description}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        type="button"
                                        className="primary-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold"
                                        onClick={() => iniciarEdicao(t._id, t.description)}
                                    >
                                        Editar
                                    </button>

                                    {t.active ? (
                                        <button
                                            type="button"
                                            className="cancel-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold"
                                            onClick={() => {
                                                onInativar(t._id)
                                                toast.success('Tipo de situação inativado!')
                                            }}
                                        >
                                            Inativar
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="primary-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold"
                                            onClick={() => {
                                                onAtivar(t._id)
                                                toast.success('Tipo de situação ativado!')
                                            }}
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
                                {/* Label + Input */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-semibold text-(--color-muted)">
                                        Descrição
                                    </label>

                                    <input
                                        className="mt-1 h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm"
                                        value={editDescricao}
                                        onChange={(e) => setEditDescricao(e.target.value)}
                                    />
                                </div>

                                {/* Botões */}
                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <button
                                        type="button"
                                        className="primary-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold"
                                        onClick={salvar}
                                    >
                                        Salvar
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold"
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
