'use client'

import { useCallback, useMemo, useState } from 'react'
import { readJsonResponse } from '@/lib/api/fetchJson'
import { withTimeZoneHeader } from '@/lib/api/time-zone-header'

export interface MeritocracySectorItem {
    _id: string
    name: string
}

export interface MeritocracyEmployeeItem {
    _id: string
    name: string
    sectorId: string
    sectorName: string
    active: boolean
}

export interface MeritocracyRecipientItem {
    employeeId: string
    employeeName: string
    sectorId: string
    sectorName: string
    employeeValue: number
}

export interface MeritocracyIgnoredEmployeeItem {
    employeeId: string
    employeeName: string
    reason: string
}

export interface MeritocracyAllocationItem {
    _id: string
    competence: string
    periodStart: string
    periodEnd: string
    paymentDate: string
    totalMeritocracyValue: number
    recipientCount: number
    status: 'success' | 'cancelled'
    cancelReason: string | null
    cancelledAt: string | null
    recipients: MeritocracyRecipientItem[]
    ignoredEmployees?: MeritocracyIgnoredEmployeeItem[]
}

interface UseMeritocracyClientProps {
    userRole: 'admin' | 'manager' | 'seller'
    initialSectors: MeritocracySectorItem[]
    initialEmployees: MeritocracyEmployeeItem[]
    initialAllocations: MeritocracyAllocationItem[]
}

function toggleInArray(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function removeFromArray(list: string[], values: string[]): string[] {
    if (values.length === 0) return list
    const toRemove = new Set(values)
    return list.filter((item) => !toRemove.has(item))
}

export function useMeritocracyClient({
    userRole,
    initialSectors,
    initialEmployees,
    initialAllocations,
}: UseMeritocracyClientProps) {
    const canWrite = userRole === 'admin' || userRole === 'manager'

    const [sectors] = useState(initialSectors)
    const [employees] = useState(initialEmployees)
    const [allocations, setAllocations] = useState(initialAllocations)

    const [competence, setCompetence] = useState('')
    const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([])
    const [includedEmployeeIds, setIncludedEmployeeIds] = useState<string[]>([])
    const [excludedEmployeeIds, setExcludedEmployeeIds] = useState<string[]>([])

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [isGeneratingPdfId, setIsGeneratingPdfId] = useState<string | null>(null)
    const [meritocracyPreview, setMeritocracyPreview] = useState<{
        totalMeritocracyValue: number
        hasActiveAllocation: boolean
    } | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [previewError, setPreviewError] = useState<string | null>(null)

    async function loadMeritocracyPreview() {
        setMeritocracyPreview(null)
        setPreviewError(null)

        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competence)) {
            setPreviewError('Informe uma competência válida antes de consultar o valor.')
            return
        }

        setIsLoadingPreview(true)
        try {
            const response = await fetch(
                `/api/meritocracy/preview?competence=${encodeURIComponent(competence)}`,
                withTimeZoneHeader(),
            )
            const payload = await readJsonResponse<{
                data?: {
                    totalMeritocracyValue: number
                    hasActiveAllocation: boolean
                }
                error?: string
            }>(response, 'Erro ao consultar o valor da meritocracia.')

            if (!response.ok || !payload.data) {
                setPreviewError(payload.error ?? 'Erro ao consultar o valor da meritocracia.')
                return
            }
            setMeritocracyPreview(payload.data)
        } catch {
            setPreviewError('Não foi possível consultar o valor da meritocracia.')
        } finally {
            setIsLoadingPreview(false)
        }
    }

    const employeesBySector = useMemo(() => {
        const map = new Map<string, MeritocracyEmployeeItem[]>()
        for (const employee of employees) {
            const current = map.get(employee.sectorId) ?? []
            current.push(employee)
            map.set(employee.sectorId, current)
        }
        return map
    }, [employees])

    const existingAllocationForCompetence = useMemo(
        () =>
            allocations.find(
                (allocation) =>
                    allocation.competence === competence && allocation.status === 'success',
            ) ?? null,
        [allocations, competence],
    )

    function isEmployeeChecked(employee: MeritocracyEmployeeItem): boolean {
        if (selectedSectorIds.includes(employee.sectorId)) {
            return !excludedEmployeeIds.includes(employee._id)
        }
        return includedEmployeeIds.includes(employee._id)
    }

    function isSectorFullySelected(sectorId: string): boolean {
        return selectedSectorIds.includes(sectorId)
    }

    function isSectorIndeterminate(sectorId: string): boolean {
        if (!selectedSectorIds.includes(sectorId)) return false
        const sectorEmployeeIds = (employeesBySector.get(sectorId) ?? []).map((e) => e._id)
        return sectorEmployeeIds.some((id) => excludedEmployeeIds.includes(id))
    }

    function toggleSector(sectorId: string) {
        const sectorEmployeeIds = (employeesBySector.get(sectorId) ?? []).map((e) => e._id)

        setSelectedSectorIds((prev) => toggleInArray(prev, sectorId))
        setExcludedEmployeeIds((prev) => removeFromArray(prev, sectorEmployeeIds))
        setIncludedEmployeeIds((prev) => removeFromArray(prev, sectorEmployeeIds))
    }

    function toggleEmployee(employee: MeritocracyEmployeeItem) {
        if (selectedSectorIds.includes(employee.sectorId)) {
            setExcludedEmployeeIds((prev) => toggleInArray(prev, employee._id))
            return
        }

        setIncludedEmployeeIds((prev) => toggleInArray(prev, employee._id))
    }

    function resetSelection() {
        setSelectedSectorIds([])
        setIncludedEmployeeIds([])
        setExcludedEmployeeIds([])
    }

    const loadAllocations = useCallback(async () => {
        try {
            const response = await fetch('/api/meritocracy', withTimeZoneHeader())
            const payload = await readJsonResponse<{ data?: MeritocracyAllocationItem[] }>(
                response,
                'Erro ao carregar lançamentos de meritocracia.',
            )
            if (response.ok) {
                setAllocations(payload.data ?? [])
            }
        } catch {
            // mantém a última lista conhecida em caso de falha de rede
        }
    }, [])

    async function launchAllocation() {
        if (!canWrite) return

        setError(null)
        setSuccess(null)

        if (!competence) {
            setError('Informe a competência (mês/ano).')
            return
        }

        if (selectedSectorIds.length === 0 && includedEmployeeIds.length === 0) {
            setError('Selecione ao menos um setor ou colaborador.')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(
                '/api/meritocracy',
                withTimeZoneHeader({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        competence,
                        selectedSectorIds,
                        includedEmployeeIds,
                        excludedEmployeeIds,
                    }),
                }),
            )

            const payload = await readJsonResponse<{
                data?: MeritocracyAllocationItem
                error?: string
                errorCode?: string
                details?: Array<{ employeeName: string }>
            }>(response, 'Erro ao lançar meritocracia.')

            if (!response.ok) {
                if (
                    (payload.errorCode === 'INELIGIBLE_EMPLOYEES' ||
                        payload.errorCode === 'NO_ELIGIBLE_RECIPIENTS') &&
                    payload.details
                ) {
                    const names = payload.details.map((item) => item.employeeName).join(', ')
                    throw new Error(
                        `Colaboradores não estavam ativos no período selecionado: ${names}.`,
                    )
                }
                throw new Error(payload.error ?? 'Erro ao lançar meritocracia.')
            }

            resetSelection()
            const ignoredNames = (payload.data?.ignoredEmployees ?? [])
                .map((employee) => employee.employeeName)
                .join(', ')
            setSuccess(
                ignoredNames
                    ? `Meritocracia lançada com sucesso. Não receberam por não estarem ativos no período: ${ignoredNames}.`
                    : 'Meritocracia lançada com sucesso.',
            )
            await loadAllocations()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao lançar meritocracia.')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function cancelAllocation(allocationId: string, reason: string) {
        if (!canWrite) return

        setError(null)
        setSuccess(null)
        setCancellingId(allocationId)

        try {
            const response = await fetch(
                `/api/meritocracy/${allocationId}/cancel`,
                withTimeZoneHeader({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason }),
                }),
            )

            const payload = await readJsonResponse<{ error?: string }>(
                response,
                'Erro ao cancelar meritocracia.',
            )

            if (!response.ok) {
                throw new Error(payload.error ?? 'Erro ao cancelar meritocracia.')
            }

            setSuccess('Lançamento cancelado com sucesso.')
            await loadAllocations()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao cancelar meritocracia.')
        } finally {
            setCancellingId(null)
        }
    }

    async function generateAllocationPdf(allocation: MeritocracyAllocationItem) {
        setIsGeneratingPdfId(allocation._id)
        try {
            const response = await fetch('/api/pdf/meritocracy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allocation),
            })

            if (!response.ok) return

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank', 'noopener,noreferrer')

            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `relatorio-meritocracia-${allocation.competence}.pdf`
            anchor.click()

            window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
        } finally {
            setIsGeneratingPdfId(null)
        }
    }

    return {
        canWrite,
        sectors,
        employees,
        allocations,

        competence,
        setCompetence,
        selectedSectorIds,
        includedEmployeeIds,
        excludedEmployeeIds,
        existingAllocationForCompetence,

        isEmployeeChecked,
        isSectorFullySelected,
        isSectorIndeterminate,
        toggleSector,
        toggleEmployee,

        isSubmitting,
        error,
        success,
        launchAllocation,
        meritocracyPreview,
        isLoadingPreview,
        previewError,
        loadMeritocracyPreview,

        cancellingId,
        cancelAllocation,

        isGeneratingPdfId,
        generateAllocationPdf,

        loadAllocations,
    }
}
