'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import type { CommissionsResult, EmployeeOption } from '../CommissionsClient'

interface CommissionsFilterProps {
    startDate: string
    endDate: string
    employeeId: string
    employees: EmployeeOption[]
    employeesLoading: boolean
    showSituations: boolean
    loading: boolean
    apiError: string | null
    setStartDate: Dispatch<SetStateAction<string>>
    setEndDate: Dispatch<SetStateAction<string>>
    setEmployeeId: Dispatch<SetStateAction<string>>
    setShowSituations: Dispatch<SetStateAction<boolean>>
    onClear: () => void
    onResult: Dispatch<SetStateAction<CommissionsResult>>
    listByPeriod: (
        start: string,
        end: string,
    ) => Promise<{
        data: Array<{
            date: string
            employeeName: string
            sectorName: string
            situation: string
            sectorValue: number
            employeeValue: number
            eligibleCount: number
            totalCount: number
        }>
        sectorSummary: Array<{
            sectorName: string
            sectorValue: number
            employeeValue?: number
        }>
        salesSummary: Array<{
            value: number
            totalCommissionValue: number
        }>
    } | null>
    listByPeriodEmployee: (
        start: string,
        end: string,
        employeeId: string,
    ) => Promise<{
        data: Array<{
            date: string
            employeeName: string
            sectorName: string
            situation: string
            sectorValue: number
            employeeValue: number
            eligibleCount: number
            totalCount: number
        }>
        sectorSummary: Array<{
            sectorName: string
            sectorValue: number
            employeeValue: number
        }>
    } | null>
    listSituations: (
        start: string,
        end: string,
    ) => Promise<Array<{
        date: string
        employeeName: string
        sectorName: string
        totalCount: number
        eligibleCount: number
        situation: string
    }> | null>
}

export default function CommissionsFilter({
    startDate,
    endDate,
    employeeId,
    employees,
    employeesLoading,
    showSituations,
    loading,
    apiError,
    setStartDate,
    setEndDate,
    setEmployeeId,
    setShowSituations,
    onClear,
    onResult,
    listByPeriod,
    listByPeriodEmployee,
    listSituations,
}: CommissionsFilterProps) {
    const [error, setError] = useState('')
    const [generatingAction, setGeneratingAction] = useState<'all' | 'employee' | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    async function handleAll() {
        if (!startDate || !endDate) {
            setError('Informe data inicial e final.')
            return
        }

        setError('')
        setGeneratingAction('all')
        setStatusMessage('Gerando relatório geral...')
        try {
            const periodResult = await listByPeriod(startDate, endDate)

            if (!periodResult) {
                return
            }

            if (periodResult.data.length === 0) {
                const message = 'Não existem registros de comissões para o período informado.'
                setError(message)
                onResult(null)
                toast.warning(message)
                return
            }

            const situations = showSituations
                ? ((await listSituations(startDate, endDate)) ?? [])
                : []

            onResult({
                type: 'all',
                startDate,
                endDate,
                data: periodResult.data,
                sectorSummary: periodResult.sectorSummary,
                salesSummary: periodResult.salesSummary,
                situations,
            })
            toast.success('Relatório geral gerado.')
        } finally {
            setGeneratingAction(null)
            setStatusMessage(null)
        }
    }

    async function handleEmployee() {
        if (!startDate || !endDate || !employeeId) {
            setError('Informe data inicial, final e selecione um colaborador.')
            return
        }

        setError('')
        setGeneratingAction('employee')
        setStatusMessage('Gerando relatório por colaborador...')
        try {
            const employeeResult = await listByPeriodEmployee(startDate, endDate, employeeId)

            if (!employeeResult) {
                return
            }

            if (employeeResult.data.length === 0) {
                const message =
                    'Não existem registros de comissões para o colaborador no período informado.'
                setError(message)
                onResult(null)
                toast.warning(message)
                return
            }

            onResult({
                type: 'employee',
                startDate,
                endDate,
                data: employeeResult.data,
                sectorSummary: employeeResult.sectorSummary,
            })
            toast.success('Relatório por colaborador gerado.')
        } finally {
            setGeneratingAction(null)
            setStatusMessage(null)
        }
    }

    function handleClear() {
        setError('')
        onClear()
    }

    function handleSelectEmployee(nextEmployeeId: string) {
        setEmployeeId(nextEmployeeId)
    }

    return (
        <div className="space-y-4 rounded-xl border border-(--color-border) bg-surface p-5">
            <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Data inicial</span>
                    <input
                        type="date"
                        className="rounded-lg border border-(--color-border) bg-surface-soft px-3 py-2"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Data final</span>
                    <input
                        type="date"
                        className="rounded-lg border border-(--color-border) bg-surface-soft px-3 py-2"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                    />
                </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Colaborador</span>
                <select
                    className="rounded-lg border border-(--color-border) bg-surface-soft px-3 py-2"
                    value={employeeId}
                    onChange={(event) => handleSelectEmployee(event.target.value)}
                    disabled={employeesLoading}
                >
                    <option value="">{employeesLoading ? 'Carregando...' : 'Selecione'}</option>
                    {employees.map((employee) => (
                        <option key={employee._id} value={employee._id}>
                            {employee.name} {employee.active ? '' : '(Inativo)'}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-(--color-muted)">
                <input
                    type="checkbox"
                    checked={showSituations}
                    onChange={(event) => setShowSituations(event.target.checked)}
                />
                Mostrar situações no relatório geral
            </label>

            {statusMessage ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    {statusMessage}
                </p>
            ) : null}

            {apiError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-(--color-danger)">
                    {apiError}
                </p>
            ) : null}

            {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-(--color-danger)">
                    {error}
                </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    className="primary-button rounded-lg px-4 py-2 disabled:opacity-70"
                    onClick={handleAll}
                    disabled={generatingAction !== null || loading}
                >
                    {generatingAction === 'all' ? 'Processando...' : 'Gerar relatório geral'}
                </button>

                <button
                    type="button"
                    className="primary-button rounded-lg border border-(--color-border) px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleEmployee}
                    disabled={
                        !employeeId || employeesLoading || generatingAction !== null || loading
                    }
                    title={!employeeId ? 'Selecione um colaborador para gerar o relatório.' : ''}
                >
                    {generatingAction === 'employee' ? 'Processando...' : 'Gerar por colaborador'}
                </button>

                <button
                    type="button"
                    className="secondary-button rounded-lg border border-(--color-border) px-4 py-2 text-sm"
                    onClick={handleClear}
                >
                    Limpar
                </button>
            </div>
        </div>
    )
}
