'use client'

interface Collaborator {
    _id: string
    name: string
}

interface SituationType {
    _id: string
    description: string
    active: boolean
}

interface Props {
    colaboradores: Collaborator[]
    tipos: SituationType[]

    filtroColaborador: string
    filtroTipo: string
    filtroDataInicial: string
    filtroDataFinal: string
    filtroMes: string
    filtroAno: string

    setFiltroColaborador: (v: string) => void
    setFiltroTipo: (v: string) => void
    setFiltroDataInicial: (v: string) => void
    setFiltroDataFinal: (v: string) => void
    setFiltroMes: (v: string) => void
    setFiltroAno: (v: string) => void

    limparFiltros: () => void
}

export default function SituationFilters({
    colaboradores,
    tipos,

    filtroColaborador,
    filtroTipo,
    filtroDataInicial,
    filtroDataFinal,
    filtroMes,
    filtroAno,

    setFiltroColaborador,
    setFiltroTipo,
    setFiltroDataInicial,
    setFiltroDataFinal,
    setFiltroMes,
    setFiltroAno,

    limparFiltros,
}: Props) {
    const anoAtual = new Date().getFullYear()
    const anos = []
    for (let ano = 2020; ano <= anoAtual + 5; ano++) anos.push(ano)

    return (
        <div className="mt-6 grid gap-4 rounded-xl border border-(--color-border) bg-white p-4 sm:grid-cols-4">
            
            {/* Colaborador */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Colaborador</label>
                <select
                    className="mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                    value={filtroColaborador}
                    onChange={(e) => setFiltroColaborador(e.target.value)}
                >
                    <option value="todos">Todos</option>
                    {colaboradores.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tipo */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Tipo</label>
                <select
                    className="mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                >
                    <option value="todos">Todos</option>
                    {tipos.map((t) => (
                        <option key={t._id} value={t._id}>
                            {t.description}
                        </option>
                    ))}
                </select>
            </div>

            {/* Data inicial */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Data inicial</label>
                <input
                    type="date"
                    className="date-field mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-xs"
                    value={filtroDataInicial}
                    onChange={(e) => setFiltroDataInicial(e.target.value)}
                />
            </div>

            {/* Data final */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Data final</label>
                <input
                    type="date"
                    className="date-field mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-xs"
                    value={filtroDataFinal}
                    onChange={(e) => setFiltroDataFinal(e.target.value)}
                />
            </div>

            {/* Mês */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Mês</label>
                <select
                    className="mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                >
                    <option value="">Todos</option>
                    <option value="01">Janeiro</option>
                    <option value="02">Fevereiro</option>
                    <option value="03">Março</option>
                    <option value="04">Abril</option>
                    <option value="05">Maio</option>
                    <option value="06">Junho</option>
                    <option value="07">Julho</option>
                    <option value="08">Agosto</option>
                    <option value="09">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                </select>
            </div>

            {/* Ano */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-(--color-muted)">Ano</label>
                <select
                    className="mt-1 h-10 rounded-lg border border-(--color-border) bg-white px-3 text-sm"
                    value={filtroAno}
                    onChange={(e) => setFiltroAno(e.target.value)}
                >
                    <option value="">Todos</option>
                    {anos.map((ano) => (
                        <option key={ano} value={ano}>
                            {ano}
                        </option>
                    ))}
                </select>
            </div>

            {/* Limpar filtros */}
            <div className="sm:col-span-4 flex justify-end">
                <button
                    type="button"
                    className="cancel-button rounded-lg px-4 py-2 text-xs font-semibold"
                    onClick={limparFiltros}
                >
                    Limpar filtros
                </button>
            </div>
        </div>
    )
}
