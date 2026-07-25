'use client'

import { useState, useEffect, useCallback } from 'react'

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

export interface SectorItem {
    _id: string
    name: string
    active: boolean
}

interface SituationClientProps {
    initialTypes: SituationTypeItem[]
    initialSituations: SituationItem[]
    initialEmployees: EmployeeItem[]
    initialSectors: SectorItem[]
}

export function useSituationClient({
    initialTypes,
    initialSituations,
    initialEmployees,
    initialSectors,
}: SituationClientProps) {
    const [types, setTypes] = useState(initialTypes)
    const [situations, setSituations] = useState(initialSituations)
    const [employees] = useState(initialEmployees)
    const [sectors] = useState(initialSectors)

    const [filterEmployee, setFilterEmployee] = useState('todos')
    const [filterType, setFilterType] = useState('todos')
    const [filterSector, setFilterSector] = useState('todos')
    const [filterStart, setFilterStart] = useState('')
    const [filterEnd, setFilterEnd] = useState('')
    const [filterMonth, setFilterMonth] = useState('')
    const [filterYear, setFilterYear] = useState('')

    function clearFilters() {
        setFilterEmployee('todos')
        setFilterType('todos')
        setFilterSector('todos')
        setFilterStart('')
        setFilterEnd('')
        setFilterMonth('')
        setFilterYear('')
    }

    const loadTypes = useCallback(async () => {
        const res = await fetch('/api/situation-types')
        const json = await res.json()
        setTypes(json.types)
    }, [])

    const loadSituations = useCallback(async () => {
        const params = new URLSearchParams()

        if (filterEmployee !== 'todos') params.set('employeeId', filterEmployee)
        if (filterType !== 'todos') params.set('typeId', filterType)
        if (filterSector !== 'todos') params.set('sectorId', filterSector)

        if (filterStart && filterEnd) {
            params.set('start', filterStart)
            params.set('end', filterEnd)
        }

        if (filterMonth) params.set('month', filterMonth)
        if (filterYear) params.set('year', filterYear)

        const res = await fetch(`/api/situations?${params.toString()}`)
        const json = await res.json()

        setSituations(json.situations)
    }, [filterEmployee, filterType, filterSector, filterStart, filterEnd, filterMonth, filterYear])

    useEffect(() => {
        loadTypes()

        loadSituations()
    }, [loadTypes, loadSituations])

    useEffect(() => {
        loadSituations()
    }, [loadSituations])

    // ===========================
    // VISIBILIDADE DE SEÇÕES
    // ===========================
    const [showTypes, setShowTypes] = useState(false)
    const [showCreate, setShowCreate] = useState(false)

    // ===========================
    // CRUD: TIPOS DE SITUAÇÃO
    // ===========================
    async function createType(descricao: string) {
        const res = await fetch('/api/situation-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: descricao }),
        })
        if (res.ok) await loadTypes()
    }

    async function editType(id: string, descricao: string) {
        const res = await fetch(`/api/situation-types/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: descricao }),
        })
        if (res.ok) await loadTypes()
    }

    async function activateType(id: string) {
        const res = await fetch(`/api/situation-types/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: true }),
        })
        if (res.ok) await loadTypes()
    }

    async function deactivateType(id: string) {
        const res = await fetch(`/api/situation-types/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: false }),
        })
        if (res.ok) await loadTypes()
    }

    // ===========================
    // CRUD: SITUAÇÕES
    // ===========================
    async function createSituation(
        dataInicial: string,
        dataFinal: string,
        colaboradorId: string,
        tipoId: string,
    ) {
        const res = await fetch('/api/situations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                startDate: dataInicial,
                endDate: dataFinal,
                employeeId: colaboradorId,
                typeId: tipoId,
            }),
        })
        if (res.ok) await loadSituations()
    }

    async function editSituation(
        id: string,
        dataInicial: string,
        dataFinal: string,
        colaboradorId: string,
        tipoId: string,
    ) {
        const res = await fetch(`/api/situations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                startDate: dataInicial,
                endDate: dataFinal,
                employeeId: colaboradorId,
                typeId: tipoId,
            }),
        })
        if (res.ok) await loadSituations()
    }

    async function activateSituation(id: string) {
        const res = await fetch(`/api/situations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: true }),
        })
        if (res.ok) await loadSituations()
    }

    async function deactivateSituation(id: string) {
        const res = await fetch(`/api/situations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: false }),
        })
        if (res.ok) await loadSituations()
    }

    return {
        types,
        situations,
        employees,
        sectors,

        filterEmployee,
        filterType,
        filterSector,
        filterStart,
        filterEnd,
        filterMonth,
        filterYear,

        setFilterEmployee,
        setFilterType,
        setFilterSector,
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
