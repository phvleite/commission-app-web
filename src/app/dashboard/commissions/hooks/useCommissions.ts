'use client'

import { useState } from 'react'
import { generatePeriodTitle } from '../utils/generatePeriodTitle'
import { generateEmployeePeriodTitle } from '../utils/generateEmployeePeriodTitle'

interface CommissionRow {
    date: string
    employeeName: string
    sectorName: string
    situation: string
    sectorValue: number
    employeeValue: number
    eligibleCount: number
    totalCount: number
}

interface SectorSummaryRow {
    sectorName: string
    sectorValue: number
    employeeValue?: number
}

interface SalesSummaryRow {
    value: number
    totalCommissionValue: number
}

interface SituationRow {
    date: string
    employeeName: string
    sectorName: string
    totalCount: number
    eligibleCount: number
    situation: string
}

interface GroupedEmployeeRow {
    employeeName: string
    sectorName: string
    totalCommission: number
}

export function useCommissions() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ============================
    // API CALLS
    // ============================

    async function listByPeriod(start: string, end: string) {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/commissions/period?start=${start}&end=${end}`)
            const json = await res.json()

            if (!res.ok) {
                setError(json.error || 'Erro ao buscar comissões por período.')
                return null
            }

            return {
                data: (json.data ?? []) as CommissionRow[],
                sectorSummary: (json.sectorSummary ?? []) as SectorSummaryRow[],
                salesSummary: (json.salesSummary ?? []) as SalesSummaryRow[],
            }
        } catch (err) {
            console.error(err)
            setError('Erro ao buscar comissões por período.')
            return null
        } finally {
            setLoading(false)
        }
    }

    async function listByPeriodEmployee(start: string, end: string, employeeId: string) {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(
                `/api/commissions/period/employee?start=${start}&end=${end}&id=${employeeId}`,
            )
            const json = await res.json()

            if (!res.ok) {
                setError(json.error || 'Erro ao buscar comissões do colaborador.')
                return null
            }

            return {
                data: (json.data ?? []) as CommissionRow[],
                sectorSummary: (json.sectorSummary ?? []) as Array<
                    SectorSummaryRow & { employeeValue: number }
                >,
            }
        } catch (err) {
            console.error(err)
            setError('Erro ao buscar comissões do colaborador.')
            return null
        } finally {
            setLoading(false)
        }
    }

    async function listSituations(start: string, end: string) {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/commissions/situations?start=${start}&end=${end}`)
            const json = await res.json()

            if (!res.ok) {
                setError(json.error || 'Erro ao buscar situações do período.')
                return null
            }

            return (json.situations ?? []) as SituationRow[]
        } catch (err) {
            console.error(err)
            setError('Erro ao buscar situações do período.')
            return null
        } finally {
            setLoading(false)
        }
    }

    // ============================
    // GROUPING & CALCULATIONS
    // ============================

    function groupByEmployee(data: CommissionRow[]): GroupedEmployeeRow[] {
        const map = new Map<string, GroupedEmployeeRow>()

        data.forEach((row) => {
            const key = row.employeeName
            const current = map.get(key) || {
                employeeName: row.employeeName,
                sectorName: row.sectorName,
                totalCommission: 0,
            }

            current.totalCommission += row.employeeValue
            map.set(key, current)
        })

        return Array.from(map.values())
    }

    function calculateTotal(data: CommissionRow[]): number {
        return data.reduce((acc, row) => acc + row.employeeValue, 0)
    }

    // ============================
    // SITUATIONS (LOCAL FILTER)
    // ============================

    function filterSituations(data: SituationRow[]): SituationRow[] {
        return data
            .filter((d) => d.situation.toUpperCase() !== 'APTO')
            .sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date)
                if (a.employeeName !== b.employeeName)
                    return a.employeeName.localeCompare(b.employeeName)
                return a.sectorName.localeCompare(b.sectorName)
            })
    }

    // ============================
    // TITLES
    // ============================

    function getPeriodTitle(start: string, end: string) {
        return generatePeriodTitle(start, end)
    }

    function getEmployeePeriodTitle(name: string, start: string, end: string) {
        return generateEmployeePeriodTitle(name, start, end)
    }

    return {
        loading,
        error,

        listByPeriod,
        listByPeriodEmployee,
        listSituations,

        groupByEmployee,
        calculateTotal,
        filterSituations,

        getPeriodTitle,
        getEmployeePeriodTitle,
    }
}
