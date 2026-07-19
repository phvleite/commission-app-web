'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface EmployeeItem {
    _id: string
    name: string
    sectorId: string
    sectorName: string
    admissionDate: string
    dismissalDate: string | null
    active: boolean
}

export interface SectorItem {
    _id: string
    name: string
}

interface Props {
    userRole: 'admin' | 'manager' | 'seller'
    initialEmployees: EmployeeItem[]
    initialSectors: SectorItem[]
}

export function EmployeesClient({ userRole, initialEmployees, initialSectors }: Props) {
    const router = useRouter()

    // ===========================
    // ESTADOS PRINCIPAIS
    // ===========================
    const [employees, setEmployees] = useState<EmployeeItem[]>(initialEmployees)
    const [sectors] = useState<SectorItem[]>(initialSectors)

    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const canWrite = userRole === 'admin' || userRole === 'manager'

    function toInputDate(value: unknown): string {
        if (!value) {
            return ''
        }

        const date = new Date(String(value))
        if (Number.isNaN(date.getTime())) {
            return ''
        }

        return date.toISOString().slice(0, 10)
    }

    function normalizeEmployee(raw: unknown): EmployeeItem {
        const candidate = raw as {
            _id?: { toString?: () => string } | string
            name?: string
            sectorId?:
                { _id?: { toString?: () => string } | string; toString?: () => string } | string
            admissionDate?: string | Date
            dismissalDate?: string | Date | null
            active?: boolean
        }

        const sectorId =
            typeof candidate.sectorId === 'string'
                ? candidate.sectorId
                : typeof candidate.sectorId?._id === 'string'
                  ? candidate.sectorId._id
                  : (candidate.sectorId?._id?.toString?.() ??
                    candidate.sectorId?.toString?.() ??
                    '')

        const sectorName =
            sectors.find((sector) => sector._id === sectorId)?.name ?? 'Setor nao encontrado'

        return {
            _id:
                typeof candidate._id === 'string'
                    ? candidate._id
                    : (candidate._id?.toString?.() ?? ''),
            name: candidate.name ?? '',
            sectorId,
            sectorName,
            admissionDate: toInputDate(candidate.admissionDate),
            dismissalDate: candidate.dismissalDate ? toInputDate(candidate.dismissalDate) : null,
            active: Boolean(candidate.active),
        }
    }

    // ===========================
    // ESTADOS DE FILTROS
    // ===========================
    const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('active')
    const [filterSector, setFilterSector] = useState<string>('all')
    const [orderBy, setOrderBy] = useState<'name' | 'sector'>('name')
    const [search, setSearch] = useState('')

    // ===========================
    // ESTADOS DE CRIAÇÃO
    // ===========================
    const [name, setName] = useState('')
    const [sectorId, setSectorId] = useState('')
    const [admissionDate, setAdmissionDate] = useState('')
    const [dismissalDate, setDismissalDate] = useState('')

    // ===========================
    // ESTADOS DE EDIÇÃO
    // ===========================
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editSectorId, setEditSectorId] = useState('')
    const [editAdmissionDate, setEditAdmissionDate] = useState('')
    const [editDismissalDate, setEditDismissalDate] = useState('')
    const [showForm, setShowForm] = useState(false)

    const filteredEmployeesCount = employees.filter((e) => {
        if (filterStatus === 'active' && !e.active) return false
        if (filterStatus === 'inactive' && e.active) return false
        if (filterSector !== 'all' && e.sectorId !== filterSector) return false
        if (search.trim() && !e.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
    }).length


    // ===========================
    // FUNÇÃO: CRIAR COLABORADOR
    // ===========================
    async function handleCreateEmployee() {
        if (!canWrite) return

        setError(null)
        setSuccess(null)

        if (!name.trim()) {
            setError('Informe o nome.')
            return
        }

        if (!sectorId) {
            setError('Selecione um setor.')
            return
        }

        if (!admissionDate) {
            setError('Informe a data de admissão.')
            return
        }

        if (dismissalDate && dismissalDate < admissionDate) {
            setError('A data de demissão não pode ser menor que a admissão.')
            return
        }

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    sectorId,
                    admissionDate,
                    dismissalDate: dismissalDate || null,
                }),
            })

            const payload = await res.json()

            if (!res.ok) {
                throw new Error(payload.error || 'Erro ao criar colaborador.')
            }

            const newEmployee = normalizeEmployee(payload.data)

            setEmployees((prev) =>
                [...prev, newEmployee].sort((a, b) => a.name.localeCompare(b.name)),
            )

            setName('')
            setSectorId('')
            setAdmissionDate('')
            setDismissalDate('')

            setSuccess('Colaborador criado com sucesso.')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar colaborador.')
        }
    }

    // ===========================
    // FUNÇÃO: INICIAR EDIÇÃO
    // ===========================
    function startEdit(employee: EmployeeItem) {
        setEditingId(employee._id)
        setEditName(employee.name)
        setEditSectorId(employee.sectorId)
        setEditAdmissionDate(employee.admissionDate)
        setEditDismissalDate(employee.dismissalDate || '')
    }

    function cancelEdit() {
        setEditingId(null)
        setEditName('')
        setEditSectorId('')
        setEditAdmissionDate('')
        setEditDismissalDate('')
    }

    function clearFilters() {
        setFilterStatus('active')
        setFilterSector('all')
        setOrderBy('name')
        setSearch('')
    }

    // ===========================
    // FUNÇÃO: SALVAR EDIÇÃO
    // ===========================
    async function handleSaveEdition(id: string) {
        if (!canWrite) return

        setError(null)
        setSuccess(null)

        if (!editName.trim()) {
            setError('Informe o nome.')
            return
        }

        if (!editSectorId) {
            setError('Selecione um setor.')
            return
        }

        if (!editAdmissionDate) {
            setError('Informe a data de admissão.')
            return
        }

        if (editDismissalDate && editDismissalDate < editAdmissionDate) {
            setError('A data de demissão não pode ser menor que a admissão.')
            return
        }

        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    sectorId: editSectorId,
                    admissionDate: editAdmissionDate,
                    dismissalDate: editDismissalDate || null,
                }),
            })

            const payload = await res.json()

            if (!res.ok) {
                throw new Error(payload.error || 'Erro ao editar colaborador.')
            }

            const updated = normalizeEmployee(payload.data)

            setEmployees((prev) =>
                prev
                    .map((e) => (e._id === id ? updated : e))
                    .sort((a, b) => a.name.localeCompare(b.name)),
            )

            setEditingId(null)
            setSuccess('Colaborador atualizado com sucesso.')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao editar colaborador.')
        }
    }

    // ===========================
    // EXPORTAR PARA PARTE 2 (JSX)
    // ===========================
    return {
        employees,
        sectors,
        error,
        success,
        canWrite,

        filterStatus,
        filterSector,
        orderBy,
        search,

        setFilterStatus,
        setFilterSector,
        setOrderBy,
        setSearch,
        clearFilters,

        name,
        sectorId,
        admissionDate,
        dismissalDate,

        setName,
        setSectorId,
        setAdmissionDate,
        setDismissalDate,

        editingId,
        editName,
        editSectorId,
        editAdmissionDate,
        editDismissalDate,

        startEdit,
        cancelEdit,
        handleCreateEmployee,
        handleSaveEdition,

        setEditName,
        setEditSectorId,
        setEditAdmissionDate,
        setEditDismissalDate,

        showForm,
        setShowForm,
        filteredEmployeesCount,
    }
}
