'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useCommissions } from './hooks/useCommissions'

export interface CommissionRow {
    date: string
    employeeName: string
    sectorName: string
    situation: string
    sectorValue: number
    employeeValue: number
    eligibleCount: number
    totalCount: number
}

export interface SectorSummaryRow {
    sectorName: string
    sectorValue: number
    employeeValue?: number
}

export interface SalesSummaryRow {
    value: number
    totalCommissionValue: number
}

export interface SituationRow {
    date: string
    employeeName: string
    sectorName: string
    totalCount: number
    eligibleCount: number
    situation: string
}

export interface EmployeeOption {
    _id: string
    name: string
    active: boolean
}

export interface CommissionsAllResult {
    type: 'all'
    startDate: string
    endDate: string
    data: CommissionRow[]
    sectorSummary: SectorSummaryRow[]
    salesSummary: SalesSummaryRow[]
    situations: SituationRow[]
}

export interface CommissionsEmployeeResult {
    type: 'employee'
    startDate: string
    endDate: string
    data: CommissionRow[]
    sectorSummary: Array<SectorSummaryRow & { employeeValue: number }>
}

export type CommissionsResult = CommissionsAllResult | CommissionsEmployeeResult | null

export interface CommissionsClientState {
    startDate: string
    endDate: string
    employeeId: string
    employees: EmployeeOption[]
    employeesLoading: boolean
    showSituations: boolean
    setStartDate: Dispatch<SetStateAction<string>>
    setEndDate: Dispatch<SetStateAction<string>>
    setEmployeeId: Dispatch<SetStateAction<string>>
    setShowSituations: Dispatch<SetStateAction<boolean>>
    result: CommissionsResult
    setResult: Dispatch<SetStateAction<CommissionsResult>>
    listByPeriod: (
        start: string,
        end: string,
    ) => Promise<{
        data: CommissionRow[]
        sectorSummary: SectorSummaryRow[]
        salesSummary: SalesSummaryRow[]
    } | null>
    listByPeriodEmployee: (
        start: string,
        end: string,
        employeeId: string,
    ) => Promise<{
        data: CommissionRow[]
        sectorSummary: Array<SectorSummaryRow & { employeeValue: number }>
    } | null>
    listSituations: (start: string, end: string) => Promise<SituationRow[] | null>
    clearFilters: () => void
}

export function useCommissionsClient(): CommissionsClientState {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [employeeId, setEmployeeId] = useState('')
    const [employees, setEmployees] = useState<EmployeeOption[]>([])
    const [employeesLoading, setEmployeesLoading] = useState(true)
    const [showSituations, setShowSituations] = useState(false)

    const [result, setResult] = useState<CommissionsResult>(null)

    const { listByPeriod, listByPeriodEmployee, listSituations } = useCommissions()

    useEffect(() => {
        let active = true

        async function loadEmployees() {
            try {
                const response = await fetch('/api/employees?includeInactive=true')
                const json = (await response.json()) as {
                    data?: Array<{
                        _id: string
                        name: string
                        active?: boolean
                    }>
                }

                if (!active) {
                    return
                }

                const normalized = (json.data ?? [])
                    .map((employee) => ({
                        _id: String(employee._id),
                        name: employee.name,
                        active: Boolean(employee.active),
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

                setEmployees(normalized)
            } catch {
                if (active) {
                    setEmployees([])
                }
            } finally {
                if (active) {
                    setEmployeesLoading(false)
                }
            }
        }

        loadEmployees()

        return () => {
            active = false
        }
    }, [])

    function clearFilters() {
        setStartDate('')
        setEndDate('')
        setEmployeeId('')
        setShowSituations(false)
        setResult(null)
    }

    return {
        startDate,
        endDate,
        employeeId,
        employees,
        employeesLoading,
        showSituations,

        setStartDate,
        setEndDate,
        setEmployeeId,
        setShowSituations,

        result,
        setResult,

        listByPeriod,
        listByPeriodEmployee,
        listSituations,
        clearFilters,
    }
}
