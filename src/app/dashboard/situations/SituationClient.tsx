'use client'

import { useState, useEffect, useCallback } from 'react'
import { withTimeZoneHeader } from '@/lib/api/time-zone-header'

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
    initialStartDate?: string
    initialEndDate?: string
}

export function useSituationClient({
    initialTypes,
    initialSituations,
    initialEmployees,
    initialSectors,
    initialStartDate = '',
    initialEndDate = '',
}: SituationClientProps) {
    const [types, setTypes] = useState(initialTypes)
    const [situations, setSituations] = useState(initialSituations)
    const [employees] = useState(initialEmployees)
    const [sectors] = useState(initialSectors)

    const [filterEmployee, setFilterEmployee] = useState('todos')
    const [filterType, setFilterType] = useState('todos')
    const [filterSector, setFilterSector] = useState('todos')
    const [filterStart, setFilterStart] = useState(initialStartDate)
    const [filterEnd, setFilterEnd] = useState(initialEndDate)
    const [filterMonth, setFilterMonth] = useState('')
    const [filterYear, setFilterYear] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [feedback, setFeedback] = useState<{
        type: 'info' | 'success' | 'error'
        message: string
    } | null>(null)

    function clearFilters() {
        setFilterEmployee('todos')
        setFilterType('todos')
        setFilterSector('todos')
        setFilterStart(initialStartDate)
        setFilterEnd(initialEndDate)
        setFilterMonth('')
        setFilterYear('')
    }

    const loadTypes = useCallback(async () => {
        try {
            const res = await fetch('/api/situation-types')
            const json = await res.json()
            setTypes(json.types)
        } catch {
            setTypes([])
        }
    }, [])

    const loadSituations = useCallback(async () => {
        setIsLoading(true)
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

        try {
            const res = await fetch(`/api/situations?${params.toString()}`, withTimeZoneHeader())
            const json = await res.json()
            setSituations(json.situations)
        } catch {
            setSituations([])
        } finally {
            setIsLoading(false)
        }
    }, [filterEmployee, filterType, filterSector, filterStart, filterEnd, filterMonth, filterYear])

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadTypes()
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [loadTypes])

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadSituations()
        }, 0)

        return () => window.clearTimeout(timeoutId)
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
        setIsSubmitting(true)
        setFeedback({ type: 'info', message: 'Salvando tipo de situação...' })
        try {
            const res = await fetch('/api/situation-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: descricao }),
            })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? 'Erro ao cadastrar tipo de situação.')
            }
            await loadTypes()
            setFeedback({ type: 'success', message: 'Tipo de situação cadastrado com sucesso.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message:
                    error instanceof Error ? error.message : 'Erro ao cadastrar tipo de situação.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function editType(id: string, descricao: string) {
        setIsSubmitting(true)
        setFeedback({ type: 'info', message: 'Salvando alterações do tipo de situação...' })
        try {
            const res = await fetch(`/api/situation-types/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: descricao }),
            })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? 'Erro ao editar tipo de situação.')
            }
            await loadTypes()
            setFeedback({ type: 'success', message: 'Tipo de situação atualizado com sucesso.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message:
                    error instanceof Error ? error.message : 'Erro ao editar tipo de situação.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function activateType(id: string) {
        setIsSubmitting(true)
        setFeedback({ type: 'info', message: 'Atualizando status do tipo de situação...' })
        try {
            const res = await fetch(`/api/situation-types/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: true }),
            })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? 'Erro ao ativar tipo de situação.')
            }
            await loadTypes()
            setFeedback({ type: 'success', message: 'Tipo de situação ativado com sucesso.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message:
                    error instanceof Error ? error.message : 'Erro ao ativar tipo de situação.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function deactivateType(id: string) {
        setIsSubmitting(true)
        setFeedback({ type: 'info', message: 'Atualizando status do tipo de situação...' })
        try {
            const res = await fetch(`/api/situation-types/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: false }),
            })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? 'Erro ao inativar tipo de situação.')
            }
            await loadTypes()
            setFeedback({ type: 'success', message: 'Tipo de situação inativado com sucesso.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message:
                    error instanceof Error ? error.message : 'Erro ao inativar tipo de situação.',
            })
        } finally {
            setIsSubmitting(false)
        }
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
        setIsSubmitting(true)
        setFeedback({ type: 'info', message: 'Salvando nova situação...' })
        try {
            const res = await fetch(
                '/api/situations',
                withTimeZoneHeader({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startDate: dataInicial,
                        endDate: dataFinal,
                        employeeId: colaboradorId,
                        typeId: tipoId,
                    }),
                }),
            )
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? 'Erro ao cadastrar situação.')
            }
            await loadSituations()
            setFeedback({ type: 'success', message: 'Situação cadastrada com sucesso.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Erro ao cadastrar situação.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function editSituation(
        id: string,
        dataInicial: string,
        dataFinal: string,
        colaboradorId: string,
        tipoId: string,
    ) {
        setIsSubmitting(true)
        setFeedback({ type: 'info', message: 'Salvando alterações da situação...' })
        try {
            const res = await fetch(
                `/api/situations/${id}`,
                withTimeZoneHeader({
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startDate: dataInicial,
                        endDate: dataFinal,
                        employeeId: colaboradorId,
                        typeId: tipoId,
                    }),
                }),
            )
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? 'Erro ao editar situação.')
            }
            await loadSituations()
            setFeedback({ type: 'success', message: 'Situação atualizada com sucesso.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Erro ao editar situação.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function activateSituation(id: string) {
        setIsSubmitting(true)
        setFeedback({ type: 'info', message: 'Atualizando status da situação...' })
        try {
            const res = await fetch(
                `/api/situations/${id}`,
                withTimeZoneHeader({
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active: true }),
                }),
            )
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? 'Erro ao ativar situação.')
            }
            await loadSituations()
            setFeedback({ type: 'success', message: 'Situação ativada com sucesso.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Erro ao ativar situação.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function deactivateSituation(id: string) {
        setIsSubmitting(true)
        setFeedback({ type: 'info', message: 'Atualizando status da situação...' })
        try {
            const res = await fetch(
                `/api/situations/${id}`,
                withTimeZoneHeader({
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active: false }),
                }),
            )
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error ?? 'Erro ao inativar situação.')
            }
            await loadSituations()
            setFeedback({ type: 'success', message: 'Situação inativada com sucesso.' })
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Erro ao inativar situação.',
            })
        } finally {
            setIsSubmitting(false)
        }
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
        isSubmitting,
        isLoading,
        feedback,
    }
}
