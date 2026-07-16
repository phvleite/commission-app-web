'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type UserRole = 'admin' | 'manager' | 'seller'

interface SectorItem {
    _id: string
    name: string
    percentage: number
    active: boolean
    isMeritocracia: boolean
}

interface Props {
    userRole: UserRole
    initialSectors: SectorItem[]
}

export function SectorsClient({ userRole, initialSectors }: Props) {
    const router = useRouter()
    const [sectors, setSectors] = useState<SectorItem[]>(initialSectors)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [percentage, setPercentage] = useState('')
    const [isMeritocracia, setIsMeritocracia] = useState(false)
    const [editingSectorId, setEditingSectorId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editPercentage, setEditPercentage] = useState('')
    const [editIsMeritocracia, setEditIsMeritocracia] = useState(false)

    const canWrite = userRole === 'admin' || userRole === 'manager'
    const sectorWithMeritocracia = useMemo(
        () => sectors.find((sector) => sector.isMeritocracia),
        [sectors],
    )
    const meritocraciaSectorId = sectorWithMeritocracia?._id ?? null
    const hasMeritocraciaAssigned = Boolean(sectorWithMeritocracia)

    const totalPercentage = useMemo(
        () =>
            sectors
                .filter((sector) => sector.active)
                .reduce((sum, sector) => sum + sector.percentage, 0),
        [sectors],
    )

    const percentageStatus =
        totalPercentage === 100
            ? 'ok'
            : totalPercentage < 100
              ? `Faltam ${100 - totalPercentage}%`
              : `Excedeu ${totalPercentage - 100}%`

    async function handleCreateSector(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch('/api/sectors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    percentage: Number(percentage),
                    isMeritocracia,
                }),
            })

            const payload = (await res.json()) as { data?: SectorItem; error?: string }
            if (!res.ok) {
                throw new Error(payload.error ?? 'Falha ao criar setor.')
            }

            setSectors((prev) =>
                [...prev, payload.data as SectorItem].sort((a, b) => a.name.localeCompare(b.name)),
            )
            setName('')
            setPercentage('')
            setIsMeritocracia(false)
            setSuccess('Setor criado com sucesso.')
            router.refresh()
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : 'Erro ao criar setor.')
        }
    }

    async function handleToggleActive(sector: SectorItem) {
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch(`/api/sectors/${sector._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !sector.active }),
            })

            const payload = (await res.json()) as { data?: SectorItem; error?: string }

            if (!res.ok) {
                throw new Error(payload.error ?? 'Falha ao atualizar status do setor.')
            }

            setSectors((prev) =>
                prev.map((item) =>
                    item._id === sector._id ? { ...item, active: !sector.active } : item,
                ),
            )
            setSuccess(
                sector.active ? 'Setor inativado com sucesso.' : 'Setor ativado com sucesso.',
            )
            router.refresh()
        } catch (toggleError) {
            setError(
                toggleError instanceof Error
                    ? toggleError.message
                    : 'Erro ao atualizar status do setor.',
            )
        }
    }

    async function handleSaveEdition(sectorId: string) {
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch(`/api/sectors/${sectorId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    percentage: Number(editPercentage),
                    isMeritocracia: editIsMeritocracia,
                }),
            })

            const payload = (await res.json()) as { data?: SectorItem; error?: string }
            if (!res.ok) {
                throw new Error(payload.error ?? 'Falha ao editar setor.')
            }

            setSectors((prev) =>
                prev
                    .map((item) =>
                        item._id === sectorId
                            ? {
                                  ...item,
                                  name: editName,
                                  percentage: Number(editPercentage),
                                  isMeritocracia: editIsMeritocracia,
                              }
                            : item,
                    )
                    .sort((a, b) => a.name.localeCompare(b.name)),
            )
            setEditingSectorId(null)
            setSuccess('Setor atualizado com sucesso.')
            router.refresh()
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Erro ao editar setor.')
        }
    }

    return (
        <section className="panel mx-auto w-full max-w-5xl p-6 sm:p-8">
            <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                Configuracoes de comissao
            </p>
            <h1 className="gold-bar-title mt-2 text-3xl font-semibold text-(--color-primary-strong)">
                Setores
            </h1>
            <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                Defina os percentuais dos setores. A soma dos setores ativos deve ser 100%.
            </p>

            <div
                className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${totalPercentage === 100 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
            >
                Soma dos percentuais ativos: {totalPercentage}%{' '}
                {totalPercentage === 100 ? '(OK)' : `(${percentageStatus})`}
            </div>

            {error ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                    {error}
                </p>
            ) : null}

            {success ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </p>
            ) : null}

            <form
                className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]"
                onSubmit={handleCreateSector}
            >
                <input
                    placeholder="Nome do setor"
                    className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    disabled={!canWrite}
                />
                <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    placeholder="Percentual"
                    className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    value={percentage}
                    onChange={(event) => setPercentage(event.target.value)}
                    required
                    disabled={!canWrite}
                />
                <button
                    type="submit"
                    className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                    disabled={!canWrite}
                >
                    Adicionar setor
                </button>
            </form>

            <label className="mt-3 inline-flex items-center gap-2 text-sm text-(--color-primary-strong)">
                <input
                    type="checkbox"
                    checked={isMeritocracia}
                    onChange={(event) => {
                        const checked = event.target.checked
                        setIsMeritocracia(checked)
                    }}
                    disabled={!canWrite || hasMeritocraciaAssigned}
                />
                Criar como setor de meritocracia
            </label>

            {hasMeritocraciaAssigned ? (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Ja existe um setor marcado como meritocracia. Para transferir ou remover essa
                    marcacao, edite o proprio setor.
                </p>
            ) : null}

            <div className="mt-6 space-y-2">
                {sectors.map((sector) => {
                    const showEditMeritocraciaOption =
                        !meritocraciaSectorId || meritocraciaSectorId === sector._id

                    return (
                        <div
                            key={sector._id}
                            className="rounded-xl border border-(--color-border) bg-white px-4 py-3"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-(--color-primary-strong)">
                                        {sector.name}
                                    </p>
                                    <p className="text-xs text-(--color-muted)">
                                        Percentual: {sector.percentage}% | Status:{' '}
                                        {sector.active ? 'Ativo' : 'Inativo'}
                                    </p>
                                    {sector.isMeritocracia ? (
                                        <p className="mt-1 text-xs font-semibold text-amber-700">
                                            Tipo: Meritocracia
                                        </p>
                                    ) : null}
                                </div>

                                {canWrite ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="primary-button rounded-lg px-3 py-1 text-xs font-semibold"
                                            onClick={() => {
                                                setEditingSectorId(sector._id)
                                                setEditName(sector.name)
                                                setEditPercentage(String(sector.percentage))
                                                setEditIsMeritocracia(sector.isMeritocracia)
                                            }}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            className="primary-button rounded-lg px-3 py-1 text-xs font-semibold"
                                            onClick={() => handleToggleActive(sector)}
                                        >
                                            {sector.active ? 'Inativar' : 'Ativar'}
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            {editingSectorId === sector._id ? (
                                <div
                                    className={`mt-3 grid gap-2 ${
                                        showEditMeritocraciaOption
                                            ? 'sm:grid-cols-[1fr_140px_auto_auto_auto]'
                                            : 'sm:grid-cols-[1fr_140px_auto_auto]'
                                    }`}
                                >
                                    <input
                                        className="h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none"
                                        value={editName}
                                        onChange={(event) => setEditName(event.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        className="h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none"
                                        value={editPercentage}
                                        onChange={(event) => setEditPercentage(event.target.value)}
                                    />
                                    {showEditMeritocraciaOption ? (
                                        <label className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 text-xs font-semibold text-(--color-primary-strong)">
                                            <input
                                                type="checkbox"
                                                checked={editIsMeritocracia}
                                                onChange={(event) => {
                                                    const checked = event.target.checked
                                                    setEditIsMeritocracia(checked)
                                                }}
                                            />
                                            Meritocracia
                                        </label>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="primary-button rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={() => handleSaveEdition(sector._id)}
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={() => {
                                            setEditingSectorId(null)
                                            setEditIsMeritocracia(false)
                                            setEditName('')
                                            setEditPercentage('')
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
