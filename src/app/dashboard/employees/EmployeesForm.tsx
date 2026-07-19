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

    onCancel?: () => void
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
    onCancel,
}: Props) {
    return (
        <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
                e.preventDefault()
                handleCreateEmployee()
            }}
        >
            {/* Nome */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Nome</label>
                <input
                    placeholder="Ex.: João Silva"
                    className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={!canWrite}
                />
            </div>

            {/* Setor */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Setor</label>
                <select
                    className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value)}
                    required
                    disabled={!canWrite}
                >
                    <option value="">Selecione...</option>
                    {sectors.map((sector) => (
                        <option key={sector._id} value={sector._id}>
                            {sector.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Datas */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-(--color-muted)">
                        Data de admissão
                    </label>
                    <input
                        type="date"
                        className="date-field h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                        value={admissionDate}
                        onChange={(e) => setAdmissionDate(e.target.value)}
                        required
                        disabled={!canWrite}
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-(--color-muted)">
                        Data de demissão (opcional)
                    </label>
                    <input
                        type="date"
                        className="date-field h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong)"
                        value={dismissalDate}
                        onChange={(e) => setDismissalDate(e.target.value)}
                        disabled={!canWrite}
                    />
                </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3">
                <button
                    type="submit"
                    className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                    disabled={!canWrite}
                >
                    Cadastrar
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="cancel-button rounded-xl px-5 py-3 text-sm font-semibold"
                >
                    Cancelar
                </button>
            </div>
        </form>
    )
}
