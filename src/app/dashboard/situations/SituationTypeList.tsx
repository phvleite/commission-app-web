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
        <div className="mt-4 space-y-2">
            {tipos.map((t) => {
                const isEditing = editId === t._id

                return (
                    <div
                        key={t._id}
                        className="rounded-xl border border-(--color-border) bg-white px-4 py-3"
                    >
                        {/* ===========================
                            MODO NORMAL
                        ============================ */}
                        {!isEditing ? (
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-semibold text-(--color-primary-strong)">
                                    {t.description}
                                </p>

                                <div className="flex items-center gap-2">
                                    {/* Botão Editar — altura corrigida */}
                                    <button
                                        type="button"
                                        className="primary-button rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={() => iniciarEdicao(t._id, t.description)}
                                    >
                                        Editar
                                    </button>

                                    {/* Botão Inativar / Ativar — altura igual ao Editar */}
                                    {t.active ? (
                                        <button
                                            type="button"
                                            className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold"
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
                                            className="primary-button rounded-lg px-3 py-2 text-xs font-semibold"
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
                        ) : null}

                        {/* ===========================
                            MODO EDIÇÃO INLINE
                        ============================ */}
                        {isEditing ? (
                            <div className="mt-3 space-y-2">
                                <input
                                    className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm w-full"
                                    value={editDescricao}
                                    onChange={(e) => setEditDescricao(e.target.value)}
                                />

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        className="primary-button rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={salvar}
                                    >
                                        Salvar
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={() => setEditId(null)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}
