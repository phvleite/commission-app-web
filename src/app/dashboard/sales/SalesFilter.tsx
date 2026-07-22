'use client'

interface SalesFiltersProps {
    startDate: string
    endDate: string
    setStartDate: (v: string) => void
    setEndDate: (v: string) => void
    clearFilters: () => void
}

export function SalesFilters({
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    clearFilters,
}: SalesFiltersProps) {
    return (
        <div className="panel p-6 rounded-xl border border-(--color-border) bg-surface mb-6">

            <h3 className="gold-bar-title text-lg font-semibold text-(--color-primary-strong)">
                Filtros por Período
            </h3>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">

                {/* ===========================
                    DATA INICIAL
                ============================ */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Data Inicial:
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-(--color-border) rounded-xl p-3 bg-surface-soft"
                    />
                </div>

                {/* ===========================
                    DATA FINAL
                ============================ */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Data Final:
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-(--color-border) rounded-xl p-3 bg-surface-soft"
                    />
                </div>

                {/* ===========================
                    LIMPAR FILTROS
                ============================ */}
                <div className="flex items-end">
                    <button
                        onClick={clearFilters}
                        className="cancel-button px-5 py-3 rounded-xl w-full"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
        </div>
    )
}
