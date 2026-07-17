'use client'

import type { SectorItem } from './EmployeesClient'

interface Props {
    name: string
    sectorId: string
    admissionDate: string
    dismissalDate: string

    sectors: SectorItem[]
    canWrite: boolean

    setName: (value: string) => void
    setSectorId: (value: string) => void
    setAdmissionDate: (value: string) => void
    setDismissalDate: (value: string) => void

    handleCreateEmployee: () => void
}

export function EmployeesForm({
    name,
    sectorId,
    admissionDate,
    dismissalDate,

    sectors,
    canWrite,

    setName,
    setSectorId,
    setAdmissionDate,
    setDismissalDate,

    handleCreateEmployee,
}: Props) {
    return (
        <form
            className="mt-6 grid gap-3 sm:grid-cols-[1fr_190px_190px_190px]"
            onSubmit={(e) => {
                e.preventDefault()
                handleCreateEmployee()
            }}
        >
            {/* Nome */}
            <input
                placeholder="Nome do colaborador"
                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!canWrite}
            />

            {/* Setor */}
            <select
                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                required
                disabled={!canWrite}
            >
                <option value="">Selecione o setor</option>
                {sectors.map((sector) => (
                    <option key={sector._id} value={sector._id}>
                        {sector.name}
                    </option>
                ))}
            </select>

            {/* Admissão */}
            <input
                type="date"
                className="date-field h-11 rounded-xl border border-(--color-border) bg-white px-3 text-xs text-(--color-primary-strong)"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                required
                disabled={!canWrite}
            />

            {/* Demissão */}
            <input
                type="date"
                className="date-field h-11 rounded-xl border border-(--color-border) bg-white px-3 text-xs text-(--color-primary-strong)"
                value={dismissalDate}
                onChange={(e) => setDismissalDate(e.target.value)}
                disabled={!canWrite}
            />

            {/* Botão */}
            <div className="sm:col-span-4 flex justify-end">
                <button
                    type="submit"
                    className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                    disabled={!canWrite}
                >
                    Adicionar
                </button>
            </div>
        </form>
    )
}
