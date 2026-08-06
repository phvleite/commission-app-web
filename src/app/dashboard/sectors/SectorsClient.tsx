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
    const [isSubmitting, setIsSubmitting] = useState(false)
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
    const activeSectorsCount = useMemo(
        () => sectors.filter((sector) => sector.active).length,
        [sectors],
    )
    const inactiveSectorsCount = sectors.length - activeSectorsCount

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
        setIsSubmitting(true)

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
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleToggleActive(sector: SectorItem) {
        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

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
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleSaveEdition(sectorId: string) {
        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

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
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="mx-auto w-full max-w-6xl space-y-6">
            <div className="panel p-6 sm:p-8">
                <h1 className="gold-bar-title mt-2 text-3xl font-semibold text-(--color-primary-strong)">
                    Setores
                </h1>
                <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                    Defina os percentuais da operacao. A soma dos setores ativos deve fechar em 100%
                    para liberar os demais modulos.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-(--color-border) bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold tracking-widest text-(--color-primary) uppercase">
                            Total de setores
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-(--color-primary-strong)">
                            {sectors.length}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-(--color-border) bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold tracking-widest text-(--color-primary) uppercase">
                            Ativos
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-700">
                            {activeSectorsCount}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-(--color-border) bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold tracking-widest text-(--color-primary) uppercase">
                            Inativos
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-amber-700">
                            {inactiveSectorsCount}
                        </p>
                    </div>
                    <div
                        className={`rounded-2xl border p-4 shadow-sm ${
                            totalPercentage === 100
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-amber-200 bg-amber-50'
                        }`}
                    >
                        <p className="text-xs font-semibold tracking-widest text-(--color-primary) uppercase">
                            Soma ativa
                        </p>
                        <p
                            className={`mt-2 text-2xl font-semibold ${
                                totalPercentage === 100 ? 'text-emerald-700' : 'text-amber-900'
                            }`}
                        >
                            {totalPercentage}%
                        </p>
                        <p
                            className={`mt-1 text-xs font-semibold ${
                                totalPercentage === 100 ? 'text-emerald-700' : 'text-amber-900'
                            }`}
                        >
                            {totalPercentage === 100 ? 'OK' : percentageStatus}
                        </p>
                    </div>
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
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
                <section className="panel p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-(--color-primary-strong)">
                        Cadastrar novo setor
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-(--color-muted)">
                        Informe nome e percentual para incluir o setor na distribuicao.
                    </p>

                    <form className="mt-5 space-y-3" onSubmit={handleCreateSector}>
                        <input
                            placeholder="Nome do setor"
                            className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            disabled={!canWrite}
                        />

                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                placeholder="Percentual"
                                className="h-11 rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={percentage}
                                onChange={(event) => setPercentage(event.target.value)}
                                required
                                disabled={!canWrite}
                            />
                            <button
                                type="submit"
                                className="primary-button rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-70"
                                disabled={!canWrite || isSubmitting}
                            >
                                {isSubmitting ? 'Processando...' : 'Adicionar setor'}
                            </button>
                        </div>

                        <label className="mt-2 inline-flex items-center gap-2 text-sm text-(--color-primary-strong)">
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
                    </form>

                    {hasMeritocraciaAssigned ? (
                        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Ja existe um setor marcado como meritocracia. Para transferir ou remover
                            essa marcacao, edite o proprio setor.
                        </p>
                    ) : null}
                </section>

                <section className="panel overflow-hidden">
                    <div className="border-b border-(--color-border) bg-surface-soft/45 px-5 py-4 sm:px-6">
                        <h2 className="text-lg font-semibold text-(--color-primary-strong)">
                            Setores cadastrados
                        </h2>
                        <p className="mt-1 text-sm text-(--color-muted)">
                            Edite dados e status de cada setor da empresa.
                        </p>
                    </div>

                    {sectors.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-(--color-muted) sm:px-6">
                            Nenhum setor cadastrado ainda.
                        </div>
                    ) : (
                        <div className="divide-y divide-(--color-border)">
                            {sectors.map((sector) => {
                                const showEditMeritocraciaOption =
                                    !meritocraciaSectorId || meritocraciaSectorId === sector._id

                                return (
                                    <article key={sector._id} className="px-5 py-4 sm:px-6 sm:py-5">
                                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-base font-semibold text-(--color-primary-strong)">
                                                    {sector.name}
                                                </p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="rounded-full border border-(--color-border) bg-white px-2.5 py-1 font-semibold text-(--color-primary-strong)">
                                                        {sector.percentage}%
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 font-semibold ${
                                                            sector.active
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {sector.active ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                    {sector.isMeritocracia ? (
                                                        <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                                                            Meritocracia
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {canWrite ? (
                                                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                                    <button
                                                        type="button"
                                                        className="primary-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                                        onClick={() => {
                                                            setEditingSectorId(sector._id)
                                                            setEditName(sector.name)
                                                            setEditPercentage(
                                                                String(sector.percentage),
                                                            )
                                                            setEditIsMeritocracia(
                                                                sector.isMeritocracia,
                                                            )
                                                        }}
                                                        disabled={isSubmitting}
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="secondary-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                                        onClick={() => handleToggleActive(sector)}
                                                        disabled={isSubmitting}
                                                    >
                                                        {sector.active ? 'Inativar' : 'Ativar'}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>

                                        {editingSectorId === sector._id ? (
                                            <div className="mt-4 rounded-xl border border-(--color-border) bg-surface-soft/45 p-3 sm:p-4">
                                                <div
                                                    className={`grid gap-2 ${
                                                        showEditMeritocraciaOption
                                                            ? 'lg:grid-cols-[minmax(0,1fr)_120px_auto_auto_auto]'
                                                            : 'lg:grid-cols-[minmax(0,1fr)_120px_auto_auto]'
                                                    }`}
                                                >
                                                    <input
                                                        className="h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none"
                                                        value={editName}
                                                        onChange={(event) =>
                                                            setEditName(event.target.value)
                                                        }
                                                    />
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        className="h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none"
                                                        value={editPercentage}
                                                        onChange={(event) =>
                                                            setEditPercentage(event.target.value)
                                                        }
                                                    />
                                                    {showEditMeritocraciaOption ? (
                                                        <label className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 text-xs font-semibold text-(--color-primary-strong)">
                                                            <input
                                                                type="checkbox"
                                                                checked={editIsMeritocracia}
                                                                onChange={(event) => {
                                                                    const checked =
                                                                        event.target.checked
                                                                    setEditIsMeritocracia(checked)
                                                                }}
                                                            />
                                                            Meritocracia
                                                        </label>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        className="primary-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                                        onClick={() =>
                                                            handleSaveEdition(sector._id)
                                                        }
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? 'Processando...' : 'Salvar'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                                        onClick={() => {
                                                            setEditingSectorId(null)
                                                            setEditIsMeritocracia(false)
                                                            setEditName('')
                                                            setEditPercentage('')
                                                        }}
                                                        disabled={isSubmitting}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>
        </section>
    )
}
