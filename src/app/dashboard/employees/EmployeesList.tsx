'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { EmployeeItem, SectorItem } from './EmployeesClient'

interface Props {
    employees: EmployeeItem[]
    sectors: SectorItem[]

    filterStatus: 'active' | 'inactive' | 'all'
    filterSector: string
    orderBy: 'name' | 'sector'
    search: string

    editingId: string | null
    editName: string
    editSectorId: string
    editSectorChangeDate: string
    editAdmissionDate: string
    editDismissalDate: string

    canWrite: boolean
    canCorrectHistory: boolean
    isSubmitting?: boolean

    startEdit: (employee: EmployeeItem) => void
    cancelEdit: () => void
    handleSaveEdition: (id: string) => Promise<{ sectorChanged: boolean } | undefined>

    setEditName: (value: string) => void
    setEditSectorId: (value: string) => void
    setEditSectorChangeDate: (value: string) => void
    setEditAdmissionDate: (value: string) => void
    setEditDismissalDate: (value: string) => void
}

interface SectorHistoryItem {
    _id: string
    sectorId: string
    sectorName: string
    startDate: string
    endDate: string | null
}

export function EmployeesList({
    employees,
    sectors,

    filterStatus,
    filterSector,
    orderBy,
    search,

    editingId,
    editName,
    editSectorId,
    editSectorChangeDate,
    editAdmissionDate,
    editDismissalDate,

    canWrite,
    canCorrectHistory,

    startEdit,
    cancelEdit,
    handleSaveEdition,

    setEditName,
    setEditSectorId,
    setEditSectorChangeDate,
    setEditAdmissionDate,
    setEditDismissalDate,
    isSubmitting = false,
}: Props) {
    const [historyEmployeeId, setHistoryEmployeeId] = useState<string | null>(null)
    const [historyByEmployee, setHistoryByEmployee] = useState<Record<string, SectorHistoryItem[]>>(
        {},
    )
    const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null)
    const [historyError, setHistoryError] = useState<string | null>(null)
    const [editingHistory, setEditingHistory] = useState<SectorHistoryItem | null>(null)
    const [historySectorId, setHistorySectorId] = useState('')
    const [historyStartDate, setHistoryStartDate] = useState('')
    const [historyEndDate, setHistoryEndDate] = useState('')

    function startHistoryCorrection(history: SectorHistoryItem) {
        setEditingHistory(history)
        setHistorySectorId(history.sectorId)
        setHistoryStartDate(history.startDate.slice(0, 10))
        setHistoryEndDate(history.endDate?.slice(0, 10) ?? '')
        setHistoryError(null)
    }

    async function saveHistoryCorrection(employeeId: string) {
        if (!editingHistory) return
        setHistoryLoadingId(employeeId)
        setHistoryError(null)
        try {
            const response = await fetch(`/api/employees/${employeeId}/sector-history`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    historyId: editingHistory._id,
                    sectorId: historySectorId,
                    startDate: historyStartDate,
                    endDate: historyEndDate || null,
                }),
            })
            const payload = (await response.json()) as {
                data?: SectorHistoryItem[]
                error?: string
            }
            if (!response.ok) {
                throw new Error(payload.error ?? 'Erro ao corrigir histórico de setores.')
            }
            setHistoryByEmployee((current) => ({
                ...current,
                [employeeId]: payload.data ?? [],
            }))
            setEditingHistory(null)
        } catch (error) {
            setHistoryError(
                error instanceof Error ? error.message : 'Erro ao corrigir histórico de setores.',
            )
        } finally {
            setHistoryLoadingId(null)
        }
    }

    async function toggleHistory(employeeId: string) {
        if (historyEmployeeId === employeeId) {
            setHistoryEmployeeId(null)
            return
        }

        setHistoryEmployeeId(employeeId)
        setHistoryError(null)
        if (historyByEmployee[employeeId]) return

        setHistoryLoadingId(employeeId)
        try {
            const response = await fetch(`/api/employees/${employeeId}/sector-history`)
            const payload = (await response.json()) as {
                data?: SectorHistoryItem[]
                error?: string
            }
            if (!response.ok) {
                throw new Error(payload.error ?? 'Erro ao carregar histórico de setores.')
            }
            setHistoryByEmployee((current) => ({
                ...current,
                [employeeId]: payload.data ?? [],
            }))
        } catch (error) {
            setHistoryError(
                error instanceof Error ? error.message : 'Erro ao carregar histórico de setores.',
            )
        } finally {
            setHistoryLoadingId(null)
        }
    }

    async function reloadHistory(employeeId: string) {
        setHistoryError(null)
        setHistoryLoadingId(employeeId)
        try {
            const response = await fetch(`/api/employees/${employeeId}/sector-history`)
            const payload = (await response.json()) as {
                data?: SectorHistoryItem[]
                error?: string
            }
            if (!response.ok) {
                throw new Error(payload.error ?? 'Erro ao carregar histórico de setores.')
            }
            setHistoryByEmployee((current) => ({
                ...current,
                [employeeId]: payload.data ?? [],
            }))
            setHistoryEmployeeId(employeeId)
        } catch (error) {
            setHistoryError(
                error instanceof Error ? error.message : 'Erro ao carregar histórico de setores.',
            )
        } finally {
            setHistoryLoadingId(null)
        }
    }

    async function saveEdition(employee: EmployeeItem) {
        if (editSectorId !== employee.sectorId && !editSectorChangeDate) {
            toast.error('Informe a data da mudança de setor.')
        }

        const result = await handleSaveEdition(employee._id)
        if (result?.sectorChanged) {
            setHistoryByEmployee((current) => {
                const next = { ...current }
                delete next[employee._id]
                return next
            })
            await reloadHistory(employee._id)
        }
    }

    function formatDateBr(value: string | null): string {
        if (!value) return ''

        const normalized = value.slice(0, 10)
        const parts = normalized.split('-')

        if (parts.length === 3) {
            const [year, month, day] = parts
            if (year && month && day) {
                return `${day}/${month}/${year}`
            }
        }

        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) return value

        return new Intl.DateTimeFormat('pt-BR').format(parsed)
    }

    // ===========================
    // FILTRAGEM + BUSCA + ORDENACAO
    // ===========================
    const filteredEmployees = useMemo(() => {
        let list = [...employees]

        if (filterStatus === 'active') {
            list = list.filter((e) => e.active)
        } else if (filterStatus === 'inactive') {
            list = list.filter((e) => !e.active)
        }

        if (filterSector !== 'all') {
            list = list.filter((e) => e.sectorId === filterSector)
        }

        if (search.trim()) {
            const term = search.trim().toLowerCase()
            list = list.filter((e) => e.name.toLowerCase().includes(term))
        }

        if (orderBy === 'name') {
            list.sort((a, b) => a.name.localeCompare(b.name))
        } else {
            list.sort((a, b) => {
                const sectorA = a.sectorName.localeCompare(b.sectorName)
                if (sectorA !== 0) return sectorA
                return a.name.localeCompare(b.name)
            })
        }

        return list
    }, [employees, filterStatus, filterSector, orderBy, search])

    // ===========================
    // RENDERIZAÇÃO
    // ===========================
    if (filteredEmployees.length === 0) {
        return (
            <div className="mt-6 rounded-xl border border-dashed border-(--color-border) bg-surface-soft p-6 text-center text-sm text-(--color-primary-weak)">
                Nenhum colaborador encontrado para os filtros aplicados.
            </div>
        )
    }

    return (
        <div className="mt-6 space-y-2">
            {filteredEmployees.map((employee) => {
                const isEditing = editingId === employee._id

                return (
                    <div
                        key={employee._id}
                        className={`${employee.active ? 'gold-bar-title' : 'danger-bar-title'} rounded-xl border border-(--color-border) bg-white px-4 py-3`}
                    >
                        {/* ===========================
                            LINHA NORMAL (SEM EDIÇÃO)
                        ============================ */}
                        {!isEditing ? (
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-(--color-primary-strong)">
                                        {employee.name}
                                    </p>

                                    <p className="text-xs text-(--color-muted)">
                                        Setor: {employee.sectorName}
                                    </p>

                                    <p className="text-[11px] text-(--color-muted)">
                                        Admissão: {formatDateBr(employee.admissionDate)}
                                        {employee.dismissalDate
                                            ? ` | Demissão: ${formatDateBr(employee.dismissalDate)}`
                                            : ''}
                                    </p>

                                    <p className="text-xs text-(--color-muted)">
                                        Status: {employee.active ? 'Ativo' : 'Inativo'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {canWrite ? (
                                        <button
                                            type="button"
                                            className="primary-button rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-70"
                                            onClick={() => startEdit(employee)}
                                            disabled={isSubmitting}
                                        >
                                            Editar
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="secondary-button rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-70"
                                        onClick={() => void toggleHistory(employee._id)}
                                        disabled={historyLoadingId === employee._id}
                                    >
                                        {historyLoadingId === employee._id
                                            ? 'Carregando...'
                                            : historyEmployeeId === employee._id
                                              ? 'Ocultar histórico'
                                              : 'Histórico de setores'}
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {historyEmployeeId === employee._id && !isEditing ? (
                            <div className="mt-3 border-t border-(--color-border) pt-3">
                                {historyError ? (
                                    <p className="text-sm text-(--color-danger)">{historyError}</p>
                                ) : historyByEmployee[employee._id]?.length ? (
                                    <div className="space-y-2">
                                        {historyByEmployee[employee._id].map((history) => (
                                            <div
                                                key={history._id}
                                                className="rounded-lg bg-surface-soft px-3 py-2 text-xs"
                                            >
                                                {editingHistory?._id === history._id ? (
                                                    <div className="grid gap-2 sm:grid-cols-3">
                                                        <select
                                                            value={historySectorId}
                                                            onChange={(event) =>
                                                                setHistorySectorId(
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="h-9 rounded-lg border border-(--color-border) bg-white px-2"
                                                        >
                                                            {sectors.map((sector) => (
                                                                <option
                                                                    key={sector._id}
                                                                    value={sector._id}
                                                                >
                                                                    {sector.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            aria-label="Início do vínculo"
                                                            type="date"
                                                            value={historyStartDate}
                                                            onChange={(event) =>
                                                                setHistoryStartDate(
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="h-9 rounded-lg border border-(--color-border) bg-white px-2"
                                                        />
                                                        <input
                                                            aria-label="Fim do vínculo"
                                                            type="date"
                                                            value={historyEndDate}
                                                            onChange={(event) =>
                                                                setHistoryEndDate(
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="h-9 rounded-lg border border-(--color-border) bg-white px-2"
                                                        />
                                                        <div className="flex gap-2 sm:col-span-3">
                                                            <button
                                                                type="button"
                                                                className="primary-button rounded-lg px-3 py-2"
                                                                onClick={() =>
                                                                    void saveHistoryCorrection(
                                                                        employee._id,
                                                                    )
                                                                }
                                                            >
                                                                Salvar correção
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="cancel-button rounded-lg px-3 py-2"
                                                                onClick={() =>
                                                                    setEditingHistory(null)
                                                                }
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                                        <span className="font-semibold">
                                                            {history.sectorName}
                                                        </span>
                                                        <span>
                                                            {formatDateBr(history.startDate)} até{' '}
                                                            {history.endDate
                                                                ? formatDateBr(history.endDate)
                                                                : 'atual'}
                                                        </span>
                                                        {canCorrectHistory ? (
                                                            <button
                                                                type="button"
                                                                className="secondary-button rounded-lg px-3 py-1"
                                                                onClick={() =>
                                                                    startHistoryCorrection(history)
                                                                }
                                                            >
                                                                Corrigir
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : historyLoadingId !== employee._id ? (
                                    <p className="text-xs text-(--color-muted)">
                                        Nenhum histórico encontrado.
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        {/* ===========================
                            LINHA DE EDIÇÃO INLINE
                        ============================ */}
                        {isEditing ? (
                            <div className="mt-3 space-y-3">
                                {/* GRID RESPONSIVO COM LABELS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* Nome */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Nome
                                        </label>
                                        <input
                                            className="mt-1 h-10 w-full rounded-lg border border-(--color-border)  bg-surface-soft px-3 text-sm"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    </div>

                                    {/* Setor */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Setor
                                        </label>
                                        <select
                                            className="mt-1 h-10 w-full rounded-lg border border-(--color-border)  bg-surface-soft px-3 text-sm"
                                            value={editSectorId}
                                            onChange={(e) => setEditSectorId(e.target.value)}
                                        >
                                            {sectors.map((sector) => (
                                                <option key={sector._id} value={sector._id}>
                                                    {sector.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {editSectorId !== employee.sectorId ? (
                                        <div className="flex flex-col">
                                            <label className="text-sm font-semibold text-(--color-muted)">
                                                Data da mudança
                                            </label>
                                            <input
                                                type="date"
                                                className="date-field mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-surface-soft px-3 text-xs"
                                                value={editSectorChangeDate}
                                                onChange={(event) =>
                                                    setEditSectorChangeDate(event.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                    ) : null}

                                    {/* Admissão */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Admissão
                                        </label>
                                        <input
                                            type="date"
                                            className="date-field mt-1 h-10 w-full rounded-lg border border-(--color-border)  bg-surface-soft px-3 text-xs"
                                            value={editAdmissionDate}
                                            onChange={(e) => setEditAdmissionDate(e.target.value)}
                                        />
                                    </div>

                                    {/* Demissão */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Demissão
                                        </label>
                                        <input
                                            type="date"
                                            className="date-field mt-1 h-10 w-full rounded-lg border border-(--color-border)  bg-surface-soft px-3 text-xs"
                                            value={editDismissalDate || ''}
                                            onChange={(e) => setEditDismissalDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* BOTÕES */}
                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <button
                                        type="button"
                                        className="primary-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-70"
                                        onClick={() => void saveEdition(employee)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Processando...' : 'Salvar'}
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-70"
                                        onClick={cancelEdit}
                                        disabled={isSubmitting}
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
