'use client'

import { useEffect, useRef } from 'react'
import type { MeritocracyEmployeeItem, MeritocracySectorItem } from './MeritocracyClient'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'

interface Props {
    canWrite: boolean
    sectors: MeritocracySectorItem[]
    employees: MeritocracyEmployeeItem[]
    competence: string
    setCompetence: (value: string) => void
    existingAllocationCompetence: string | null
    isEmployeeChecked: (employee: MeritocracyEmployeeItem) => boolean
    isSectorFullySelected: (sectorId: string) => boolean
    isSectorIndeterminate: (sectorId: string) => boolean
    toggleSector: (sectorId: string) => void
    toggleEmployee: (employee: MeritocracyEmployeeItem) => void
    isSubmitting: boolean
    error: string | null
    success: string | null
    onSubmit: () => void
    meritocracyPreview: {
        totalMeritocracyValue: number
        hasActiveAllocation: boolean
    } | null
    isLoadingPreview: boolean
    previewError: string | null
    onPreview: () => void
}

function SectorCheckbox({
    checked,
    indeterminate,
    onChange,
    disabled,
    label,
}: {
    checked: boolean
    indeterminate: boolean
    onChange: () => void
    disabled?: boolean
    label: string
}) {
    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate && !checked
        }
    }, [indeterminate, checked])

    return (
        <label className="flex items-center gap-2 text-sm font-semibold text-(--color-primary-strong)">
            <input
                ref={ref}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="h-4 w-4"
            />
            {label}
        </label>
    )
}

function EmployeeCheckbox({
    employee,
    checked,
    disabled,
    onChange,
}: {
    employee: MeritocracyEmployeeItem
    checked: boolean
    disabled?: boolean
    onChange: () => void
}) {
    return (
        <label className="flex items-center gap-2 text-sm text-(--color-primary-strong)">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="h-4 w-4"
            />
            {employee.name}
            {!employee.active ? (
                <span className="text-xs text-(--color-muted)">(Inativo)</span>
            ) : null}
        </label>
    )
}

export function MeritocracyLaunchForm({
    canWrite,
    sectors,
    employees,
    competence,
    setCompetence,
    existingAllocationCompetence,
    isEmployeeChecked,
    isSectorFullySelected,
    isSectorIndeterminate,
    toggleSector,
    toggleEmployee,
    isSubmitting,
    error,
    success,
    onSubmit,
    meritocracyPreview,
    isLoadingPreview,
    previewError,
    onPreview,
}: Props) {
    const sectorIds = new Set(sectors.map((sector) => sector._id))
    const employeesBySector = new Map<string, MeritocracyEmployeeItem[]>()
    const orphanEmployees: MeritocracyEmployeeItem[] = []

    for (const employee of employees) {
        if (sectorIds.has(employee.sectorId)) {
            const current = employeesBySector.get(employee.sectorId) ?? []
            current.push(employee)
            employeesBySector.set(employee.sectorId, current)
        } else {
            orphanEmployees.push(employee)
        }
    }

    const isBlockedByExistingAllocation = Boolean(existingAllocationCompetence)

    return (
        <div className="panel rounded-xl border border-(--color-border) bg-surface p-6">
            <h3 className="gold-bar-title text-lg font-semibold text-(--color-primary-strong)">
                Lançamento de Meritocracia
            </h3>

            <div className="mt-4 flex flex-col gap-1 sm:max-w-xs">
                <label className="text-xs font-semibold text-(--color-muted)">
                    Competência (mês/ano)
                </label>
                <input
                    type="month"
                    value={competence}
                    onChange={(event) => setCompetence(event.target.value)}
                    className="h-11 rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm"
                    disabled={!canWrite}
                />
                <button
                    type="button"
                    className="secondary-button mt-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70"
                    onClick={onPreview}
                    disabled={!canWrite || isLoadingPreview}
                >
                    {isLoadingPreview ? 'Consultando...' : 'Consultar valor apurado'}
                </button>
            </div>

            {isLoadingPreview ? (
                <p className="mt-4 rounded-xl border border-(--color-border) bg-surface-soft px-4 py-3 text-sm text-(--color-muted)">
                    Consultando valor apurado...
                </p>
            ) : null}

            {previewError ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                    {previewError}
                </p>
            ) : null}

            {meritocracyPreview && !isLoadingPreview ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <p className="font-semibold">Valor total apurado para a competência</p>
                    <p className="mt-1 text-lg font-bold">
                        R$ {formatCurrencyFromDatabase(meritocracyPreview.totalMeritocracyValue)}
                    </p>
                    {meritocracyPreview.hasActiveAllocation ? (
                        <p className="mt-1 font-semibold text-amber-800">
                            Esta competência já possui um lançamento ativo.
                        </p>
                    ) : null}
                </div>
            ) : null}

            {isBlockedByExistingAllocation ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    Já existe um lançamento ativo para {existingAllocationCompetence}. Cancele-o
                    antes de lançar novamente.
                </p>
            ) : null}

            <div className="mt-6 space-y-4">
                {sectors.map((sector) => (
                    <div
                        key={sector._id}
                        className="rounded-xl border border-(--color-border) bg-white p-4"
                    >
                        <SectorCheckbox
                            checked={isSectorFullySelected(sector._id)}
                            indeterminate={isSectorIndeterminate(sector._id)}
                            onChange={() => toggleSector(sector._id)}
                            disabled={!canWrite}
                            label={sector.name}
                        />

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {(employeesBySector.get(sector._id) ?? []).map((employee) => (
                                <EmployeeCheckbox
                                    key={employee._id}
                                    employee={employee}
                                    checked={isEmployeeChecked(employee)}
                                    disabled={!canWrite}
                                    onChange={() => toggleEmployee(employee)}
                                />
                            ))}
                            {(employeesBySector.get(sector._id) ?? []).length === 0 ? (
                                <p className="text-xs text-(--color-muted)">
                                    Nenhum colaborador neste setor.
                                </p>
                            ) : null}
                        </div>
                    </div>
                ))}

                {orphanEmployees.length > 0 ? (
                    <div className="rounded-xl border border-(--color-border) bg-white p-4">
                        <p className="text-sm font-semibold text-(--color-primary-strong)">
                            Outros colaboradores
                        </p>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {orphanEmployees.map((employee) => (
                                <EmployeeCheckbox
                                    key={employee._id}
                                    employee={employee}
                                    checked={isEmployeeChecked(employee)}
                                    disabled={!canWrite}
                                    onChange={() => toggleEmployee(employee)}
                                />
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            {error ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                    {error}
                </p>
            ) : null}

            {success ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </p>
            ) : null}

            {canWrite ? (
                <div className="mt-6">
                    <button
                        type="button"
                        className="primary-button rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-70"
                        onClick={onSubmit}
                        disabled={isSubmitting || isBlockedByExistingAllocation}
                    >
                        {isSubmitting ? 'Processando...' : 'Lançar meritocracia'}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
