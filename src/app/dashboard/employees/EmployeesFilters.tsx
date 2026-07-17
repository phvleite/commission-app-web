'use client'

interface Props {
    filterStatus: 'active' | 'inactive' | 'all'
    filterSector: string
    orderBy: 'name' | 'sector'
    search: string

    sectors: { _id: string; name: string }[]

    setFilterStatus: (value: 'active' | 'inactive' | 'all') => void
    setFilterSector: (value: string) => void
    setOrderBy: (value: 'name' | 'sector') => void
    setSearch: (value: string) => void
    clearFilters: () => void
}

export function EmployeesFilters({
    filterStatus,
    filterSector,
    orderBy,
    search,
    sectors,

    setFilterStatus,
    setFilterSector,
    setOrderBy,
    setSearch,
    clearFilters,
}: Props) {
    return (
        <div className="mt-6 grid gap-4 rounded-xl border border-(--color-border) bg-white p-4 sm:grid-cols-4">
            {/* Filtro por status */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Status</label>
                <select
                    className="mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                    value={filterStatus}
                    onChange={(e) =>
                        setFilterStatus(e.target.value as 'active' | 'inactive' | 'all')
                    }
                >
                    <option value="active">Ativos</option>
                    <option value="inactive">Demitidos</option>
                    <option value="all">Todos</option>
                </select>
            </div>

            {/* Filtro por setor */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Setor</label>
                <select
                    className="mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                    value={filterSector}
                    onChange={(e) => setFilterSector(e.target.value)}
                >
                    <option value="all">Todos</option>
                    {sectors.map((sector) => (
                        <option key={sector._id} value={sector._id}>
                            {sector.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Ordenação */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Ordenar por</label>
                <select
                    className="mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                    value={orderBy}
                    onChange={(e) => setOrderBy(e.target.value as 'name' | 'sector')}
                >
                    <option value="name">Nome</option>
                    <option value="sector">Setor + Nome</option>
                </select>
            </div>

            {/* Busca */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Buscar</label>
                <input
                    type="text"
                    placeholder="Nome do colaborador"
                    className="mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="sm:col-span-4 flex justify-end">
                <button
                    type="button"
                    className="cancel-button rounded-lg px-4 py-2 text-xs font-semibold"
                    onClick={clearFilters}
                >
                    Limpar filtros
                </button>
            </div>
        </div>
    )
}
