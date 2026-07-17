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
        if (!value) {
            return ''
        }

        const normalized = value.slice(0, 10)
        const parts = normalized.split('-')

        if (parts.length === 3) {
            const [year, month, day] = parts
            if (year && month && day) {
                return `${day}/${month}/${year}`
            }
        }

        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) {
            return value
        }

        return new Intl.DateTimeFormat('pt-BR').format(parsed)
    }

    // ===========================
    // FILTRAGEM + BUSCA + ORDENACAO
    // ===========================
    const filteredEmployees = useMemo(() => {
        let list = [...employees]

        // Filtro por status
        if (filterStatus === 'active') {
            list = list.filter((e) => e.active)
        } else if (filterStatus === 'inactive') {
            list = list.filter((e) => !e.active)
        }

        // Filtro por setor
        if (filterSector !== 'all') {
            list = list.filter((e) => e.sectorId === filterSector)
        }

        // Busca por nome
        if (search.trim()) {
            const term = search.trim().toLowerCase()
            list = list.filter((e) => e.name.toLowerCase().includes(term))
        }

        // Ordenação
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
                        className="rounded-xl border border-(--color-border) bg-white px-4 py-3"
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
                            <div className="mt-3 space-y-2">
                                <div className="grid gap-2 sm:grid-cols-[1fr_190px_190px_190px]">
                                    {/* Nome */}
                                    <input
                                        className="h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                    />

                                    {/* Setor */}
                                    <select
                                        className="h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                                        value={editSectorId}
                                        onChange={(e) => setEditSectorId(e.target.value)}
                                    >
                                        {sectors.map((sector) => (
                                            <option key={sector._id} value={sector._id}>
                                                {sector.name}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Admissão */}
                                    <input
                                        type="date"
                                        className="date-field h-10 rounded-lg border border-(--color-border) bg-white px-3 text-xs"
                                        value={editAdmissionDate}
                                        onChange={(e) => setEditAdmissionDate(e.target.value)}
                                    />

                                    {/* Demissão */}
                                    <input
                                        type="date"
                                        className="date-field h-10 rounded-lg border border-(--color-border) bg-white px-3 text-xs"
                                        value={editDismissalDate || ''}
                                        onChange={(e) => setEditDismissalDate(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    {/* Salvar */}
                                    <button
                                        type="button"
                                        className="primary-button rounded-lg px-3 py-2 text-xs font-semibold"
                                        onClick={() => handleSaveEdition(employee._id)}
                                    >
                                        Salvar
                                    </button>

                                    {/* Cancelar */}
                                    <button
                                        type="button"
                                        className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold"
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
