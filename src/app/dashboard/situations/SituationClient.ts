'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface SituationTypeItem {
    _id: string
    description: string
    active: boolean
}

export interface SituationItem {
    _id: string
    employeeId: string
    employeeName: string
    typeId: string
    typeDescription: string
    startDate: string
    endDate: string
    active: boolean
}

export interface EmployeeItem {
    _id: string
    name: string
    active: boolean
}

interface SituationClientProps {
    initialTypes: SituationTypeItem[]
    initialSituations: SituationItem[]
    initialEmployees: EmployeeItem[]
}

export function SituationClient({
    initialTypes,
    initialSituations,
    initialEmployees,
}: SituationClientProps) {
    // ============================================================
    // ESTADOS PRINCIPAIS
    // ============================================================
    const [types, setTypes] = useState<SituationTypeItem[]>(initialTypes)
    const [situations, setSituations] = useState<SituationItem[]>(initialSituations)
    const [employees] = useState<EmployeeItem[]>(initialEmployees)

    // ============================================================
    // FILTROS
    // ============================================================
    const [filterEmployee, setFilterEmployee] = useState('todos')
    const [filterType, setFilterType] = useState('todos')
    const [filterStart, setFilterStart] = useState('')
    const [filterEnd, setFilterEnd] = useState('')
    const [filterMonth, setFilterMonth] = useState('')
    const [filterYear, setFilterYear] = useState('')

    function clearFilters() {
        setFilterEmployee('todos')
        setFilterType('todos')
        setFilterStart('')
        setFilterEnd('')
        setFilterMonth('')
        setFilterYear('')
    }

    // ============================================================
    // CONTROLES DE EXIBIÇÃO
    // ============================================================
    const [showTypes, setShowTypes] = useState(false)
    const [showCreate, setShowCreate] = useState(false)

    // ============================================================
    // CARREGAMENTO DE TIPOS
    // ============================================================
    const loadTypes = useCallback(async () => {
        const res = await fetch('/api/situation-types')
        const json = (await res.json()) as { types: SituationTypeItem[] }
        setTypes(json.types)
    }, [])

    // ============================================================
    // CARREGAMENTO DE SITUAÇÕES
    // ============================================================
    const loadSituations = useCallback(async () => {
        const res = await fetch('/api/situations')
        const json = (await res.json()) as { situations: SituationItem[] }

        let data = json.situations

        // Filtro: colaborador
        if (filterEmployee !== 'todos') {
            data = data.filter((s: SituationItem) => s.employeeId === filterEmployee)
        }

        // Filtro: tipo
        if (filterType !== 'todos') {
            data = data.filter((s: SituationItem) => s.typeId === filterType)
        }

        // Filtro: data inicial
        if (filterStart) {
            data = data.filter((s: SituationItem) => s.startDate >= filterStart)
        }

        // Filtro: data final
        if (filterEnd) {
            data = data.filter((s: SituationItem) => s.endDate <= filterEnd)
        }

        // Filtro: mês
        if (filterMonth) {
            data = data.filter((s: SituationItem) => s.startDate.substring(5, 7) === filterMonth)
        }

        // Filtro: ano
        if (filterYear) {
            data = data.filter((s: SituationItem) => s.startDate.substring(0, 4) === filterYear)
        }

        setSituations(data)
    }, [filterEmployee, filterType, filterStart, filterEnd, filterMonth, filterYear])

    // ============================================================
    // CRUD — TIPOS DE SITUAÇÃO
    // ============================================================
    async function createType(description: string) {
        const res = await fetch('/api/situation-types', {
            method: 'POST',
            body: JSON.stringify({ description }),
        })

        if (!res.ok) {
            toast.error('Erro ao criar tipo.')
            return
        }

        toast.success('Tipo criado!')
        loadTypes()
    }

    async function editType(id: string, description: string) {
        const res = await fetch(`/api/situation-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ description }),
        })

        if (!res.ok) {
            toast.error('Erro ao editar tipo.')
            return
        }

        toast.success('Tipo atualizado!')
        loadTypes()
    }

    async function activateType(id: string) {
        await fetch(`/api/situation-types/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ active: true }),
        })
        toast.success('Tipo ativado!')
        loadTypes()
    }

    async function deactivateType(id: string) {
        await fetch(`/api/situation-types/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ active: false }),
        })
        toast.success('Tipo inativado!')
        loadTypes()
    }

    // ============================================================
    // CRUD — SITUAÇÕES
    // ============================================================
    async function createSituation(
        startDate: string,
        endDate: string,
        employeeId: string,
        typeId: string,
    ) {
        const res = await fetch('/api/situations', {
            method: 'POST',
            body: JSON.stringify({
                startDate,
                endDate,
                employeeId,
                typeId,
            }),
        })

        const json = await res.json()

        if (!res.ok) {
            toast.error(json.error || 'Erro ao criar situação.')
            return
        }

        toast.success('Situação criada!')
        loadSituations()
    }

    async function editSituation(
        id: string,
        startDate: string,
        endDate: string,
        employeeId: string,
        typeId: string,
    ) {
        const res = await fetch(`/api/situations/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                startDate,
                endDate,
                employeeId,
                typeId,
            }),
        })

        const json = await res.json()

        if (!res.ok) {
            toast.error(json.error || 'Erro ao editar situação.')
            return
        }

        toast.success('Situação atualizada!')
        loadSituations()
    }

    async function activateSituation(id: string) {
        await fetch(`/api/situations/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ active: true }),
        })
        toast.success('Situação ativada!')
        loadSituations()
    }

    async function deactivateSituation(id: string) {
        await fetch(`/api/situations/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ active: false }),
        })
        toast.success('Situação inativada!')
        loadSituations()
    }

    // ============================================================
    // USE EFFECTS
    // ============================================================
    useEffect(() => {
        loadTypes()
        loadSituations()
    }, [loadTypes, loadSituations])

    useEffect(() => {
        loadSituations()
    }, [loadSituations])

    // ============================================================
    // RETORNO PARA O JSX
    // ============================================================
    return {
        types,
        situations,
        employees,

        filterEmployee,
        filterType,
        filterStart,
        filterEnd,
        filterMonth,
        filterYear,

        setFilterEmployee,
        setFilterType,
        setFilterStart,
        setFilterEnd,
        setFilterMonth,
        setFilterYear,
        clearFilters,

        createType,
        editType,
        activateType,
        deactivateType,

        createSituation,
        editSituation,
        activateSituation,
        deactivateSituation,

        showTypes,
        setShowTypes,
        showCreate,
        setShowCreate,
    }
}
