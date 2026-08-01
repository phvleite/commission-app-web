'use client'

import SituationForm from './SituationForm'
import SituationList from './SituationList'
import SituationFilters from './SituationFilters'
import SituationTypeForm from './SituationTypeForm'
import SituationTypeList from './SituationTypeList'

import {
    useSituationClient,
    type EmployeeItem,
    type SituationItem,
    type SituationTypeItem,
    type SectorItem,
} from './SituationClient'

export default function SituationClientJSX({
    initialTypes,
    initialSituations,
    initialEmployees,
    initialSectors,
    initialStartDate,
    initialEndDate,
}: {
    initialTypes: SituationTypeItem[]
    initialSituations: SituationItem[]
    initialEmployees: EmployeeItem[]
    initialSectors: SectorItem[]
    initialStartDate?: string
    initialEndDate?: string
}) {
    const client = useSituationClient({
        initialTypes,
        initialSituations,
        initialEmployees,
        initialSectors,
        initialStartDate,
        initialEndDate,
    })

    const {
        types,
        situations,
        employees,
        sectors,

        filterEmployee,
        filterType,
        filterSector,
        filterStart,
        filterEnd,
        filterMonth,
        filterYear,

        setFilterEmployee,
        setFilterType,
        setFilterSector,
        setFilterStart,
        setFilterEnd,
        setFilterMonth,
        setFilterYear,
        clearFilters,

        createType,
        editType,
        activateType,
        deactivateType,

        createSituation,
        editSituation,
        activateSituation,
        deactivateSituation,
        exportSituationsPdf,

        showTypes,
        setShowTypes,
        showCreate,
        setShowCreate,
        isSubmitting,
        isExportingPdf,
        isLoading,
        feedback,
    } = client

    return (
        <section className="panel mx-auto w-full max-w-5xl p-4 sm:p-8 space-y-8">
            {/* Título */}
            <h1 className="gold-bar-title mt-2 text-2xl sm:text-3xl font-semibold text-(--color-primary-strong)">
                Situações
            </h1>

            <p className="mt-2 text-sm leading-6 sm:leading-7 text-(--color-muted)">
                Gerencie as situações dos colaboradores. Cadastre tipos, crie situações, filtre e
                edite conforme necessário.
            </p>

            {feedback ? (
                <p
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                        feedback.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : feedback.type === 'error'
                              ? 'border-red-200 bg-red-50 text-(--color-danger)'
                              : 'border-amber-200 bg-amber-50 text-amber-900'
                    }`}
                >
                    {feedback.message}
                </p>
            ) : null}

            {/* Botões principais */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    className="primary-button w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-70"
                    onClick={() => setShowTypes(!showTypes)}
                    disabled={isSubmitting}
                >
                    Tipos de Situação
                </button>

                <button
                    className="primary-button w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-70"
                    onClick={() => setShowCreate(!showCreate)}
                    disabled={isSubmitting}
                >
                    Cadastro de Situação
                </button>
            </div>

            {/* TIPOS DE SITUAÇÃO */}
            {showTypes && (
                <section className="rounded-xl border border-(--color-border) bg-white p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <h2 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                        Tipos de Situação
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="rounded-xl border border-(--color-border) bg-white p-4 space-y-4">
                            <h3 className="gold-bar-title text-lg font-semibold text-(--color-primary-strong)">
                                Novo Tipo de Situação
                            </h3>

                            <SituationTypeForm onSubmit={createType} isSubmitting={isSubmitting} />
                        </div>

                        <div className="rounded-xl border border-(--color-border) bg-white p-4 space-y-4">
                            <h3 className="gold-bar-title text-lg font-semibold text-(--color-primary-strong)">
                                Tipos de Situação
                            </h3>

                            <SituationTypeList
                                tipos={types}
                                onEditar={editType}
                                onAtivar={activateType}
                                onInativar={deactivateType}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* CADASTRO DE SITUAÇÃO */}
            {showCreate && (
                <section className="rounded-xl border border-(--color-border) bg-white p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <h2 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                        Cadastro de Situação
                    </h2>

                    {types.filter((t) => t.active).length === 0 ? (
                        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-(--color-primary-strong)">
                            ⚠ Não é possível cadastrar uma Situação porque não existe nenhum Tipo de
                            Situação ativo.
                            <br />
                            Cadastre um Tipo de Situação acima.
                        </div>
                    ) : (
                        <SituationForm
                            colaboradores={employees}
                            tipos={types.filter((t) => t.active)}
                            onSubmit={createSituation}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </section>
            )}

            {/* FILTROS */}
            <SituationFilters
                colaboradores={employees}
                tipos={types}
                setores={sectors}
                filtroColaborador={filterEmployee}
                filtroTipo={filterType}
                filtroSetor={filterSector}
                filtroDataInicial={filterStart}
                filtroDataFinal={filterEnd}
                filtroMes={filterMonth}
                filtroAno={filterYear}
                setFiltroColaborador={setFilterEmployee}
                setFiltroTipo={setFilterType}
                setFiltroSetor={setFilterSector}
                setFiltroDataInicial={setFilterStart}
                setFiltroDataFinal={setFilterEnd}
                setFiltroMes={setFilterMonth}
                setFiltroAno={setFilterYear}
                limparFiltros={clearFilters}
            />

            <div className="flex justify-end">
                <button
                    type="button"
                    className="primary-button w-full sm:w-auto rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70"
                    onClick={exportSituationsPdf}
                    disabled={isExportingPdf || isLoading || situations.length === 0}
                >
                    {isExportingPdf ? 'Gerando PDF...' : 'Gerar PDF das situacoes exibidas'}
                </button>
            </div>

            {/* LISTA */}
            {isLoading ? (
                <div className="rounded-xl border border-dashed border-(--color-border) bg-surface-soft p-6 text-center text-sm text-(--color-primary-weak)">
                    Carregando situações...
                </div>
            ) : situations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--color-border) bg-surface-soft p-6 text-center text-sm text-(--color-primary-weak)">
                    Nenhuma situação encontrada para os filtros aplicados.
                </div>
            ) : (
                <SituationList
                    situacoes={situations}
                    colaboradores={employees}
                    tipos={types}
                    onEditar={editSituation}
                    onAtivar={activateSituation}
                    onInativar={deactivateSituation}
                    isSubmitting={isSubmitting}
                />
            )}
        </section>
    )
}
