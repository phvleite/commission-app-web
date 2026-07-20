'use client'

import { useMemo } from 'react'
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
    editAdmissionDate: string
    editDismissalDate: string

    canWrite: boolean

    startEdit: (employee: EmployeeItem) => void
    cancelEdit: () => void
    handleSaveEdition: (id: string) => void

    setEditName: (value: string) => void
    setEditSectorId: (value: string) => void
    setEditAdmissionDate: (value: string) => void
    setEditDismissalDate: (value: string) => void
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
    editAdmissionDate,
    editDismissalDate,

    canWrite,

    startEdit,
    cancelEdit,
    handleSaveEdition,

    setEditName,
    setEditSectorId,
    setEditAdmissionDate,
    setEditDismissalDate,
}: Props) {
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

                                {canWrite ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="primary-button rounded-lg px-3 py-1 text-xs font-semibold"
                                            onClick={() => startEdit(employee)}
                                        >
                                            Editar
                                        </button>
                                    </div>
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
                                            className="mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-white px-3 text-sm"
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
                                            className="mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-white px-3 text-sm"
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

                                    {/* Admissão */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-(--color-muted)">
                                            Admissão
                                        </label>
                                        <input
                                            type="date"
                                            className="date-field mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-white px-3 text-xs"
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
                                            className="date-field mt-1 h-10 w-full rounded-lg border border-(--color-border) bg-white px-3 text-xs"
                                            value={editDismissalDate || ''}
                                            onChange={(e) => setEditDismissalDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* BOTÕES */}
                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <button
                                        type="button"
                                        className="primary-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold"
                                        onClick={() => handleSaveEdition(employee._id)}
                                    >
                                        Salvar
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-button w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold"
                                        onClick={cancelEdit}
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
