'use client'

import SituationForm from './SituationForm'
import SituationList from './SituationList'
import SituationFilters from './SituationFilters'
import SituationTypeForm from './SituationTypeForm'
import SituationTypeList from './SituationTypeList'

import {
    SituationClient,
    type EmployeeItem,
    type SituationItem,
    type SituationTypeItem,
} from './SituationClient'

export default function SituationClientJSX({
    initialTypes,
    initialSituations,
    initialEmployees,
}: {
    initialTypes: SituationTypeItem[]
    initialSituations: SituationItem[]
    initialEmployees: EmployeeItem[]
}) {
    const client = SituationClient({
        initialTypes,
        initialSituations,
        initialEmployees,
    })

    const {
        types,
        situations,
        employees,

        filterEmployee,
        filterType,
        filterStart,
        filterEnd,
        filterMonth,
        filterYear,

        setFilterEmployee,
        setFilterType,
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

        showTypes,
        setShowTypes,
        showCreate,
        setShowCreate,
    } = client

    return (
        <section className="panel mx-auto w-full max-w-5xl p-6 sm:p-8 space-y-8">
            {/* Título */}
            <h1 className="gold-bar-title mt-2 text-3xl font-semibold text-(--color-primary-strong)">
                Situações
            </h1>

            <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                Gerencie as situações dos colaboradores. Cadastre tipos, crie situações, filtre e edite conforme necessário.
            </p>

            {/* Botões principais */}
            <div className="flex gap-4">
                <button
                    className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                    onClick={() => setShowTypes(!showTypes)}
                >
                    Tipos de Situação
                </button>

                <button
                    className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                    onClick={() => setShowCreate(!showCreate)}
                >
                    Cadastro de Situação
                </button>
            </div>

            {/* ============================================================
                TIPOS DE SITUAÇÃO
            ============================================================ */}
            {showTypes && (
                <section className="rounded-xl border border-(--color-border) bg-white p-6 space-y-6">
                    <h2 className="text-xl font-semibold text-(--color-primary-strong)">
                        Tipos de Situação
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Formulário */}
                        <div className="rounded-xl border border-(--color-border) bg-white p-4 space-y-4">
                            <h3 className="text-lg font-semibold text-(--color-primary-strong)">
                                Novo Tipo de Situação
                            </h3>

                            <SituationTypeForm onSubmit={createType} />
                        </div>

                        {/* Lista */}
                        <div className="rounded-xl border border-(--color-border) bg-white p-4 space-y-4">
                            <h3 className="text-lg font-semibold text-(--color-primary-strong)">
                                Tipos de Situação
                            </h3>

                            <SituationTypeList
                                tipos={types}
                                onEditar={editType}
                                onAtivar={activateType}
                                onInativar={deactivateType}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* ============================================================
                CADASTRO DE SITUAÇÃO
            ============================================================ */}
            {showCreate && (
                <section className="rounded-xl border border-(--color-border) bg-white p-6 space-y-6">
                    <h2 className="text-xl font-semibold text-(--color-primary-strong)">
                        Cadastro de Situação
                    </h2>

                    {types.filter((t) => t.active).length === 0 ? (
                        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-(--color-primary-strong)">
                            ⚠ Não é possível cadastrar uma Situação porque não existe nenhum Tipo de Situação ativo.
                            <br />
                            Cadastre um Tipo de Situação acima.
                        </div>
                    ) : (
                        <SituationForm
                            colaboradores={employees}
                            tipos={types.filter((t) => t.active)}
                            onSubmit={createSituation}
                        />
                    )}
                </section>
            )}

            {/* ============================================================
                FILTROS
            ============================================================ */}
            <SituationFilters
                colaboradores={employees}
                tipos={types}
                filtroColaborador={filterEmployee}
                filtroTipo={filterType}
                filtroDataInicial={filterStart}
                filtroDataFinal={filterEnd}
                filtroMes={filterMonth}
                filtroAno={filterYear}
                setFiltroColaborador={setFilterEmployee}
                setFiltroTipo={setFilterType}
                setFiltroDataInicial={setFilterStart}
                setFiltroDataFinal={setFilterEnd}
                setFiltroMes={setFilterMonth}
                setFiltroAno={setFilterYear}
                limparFiltros={clearFilters}
            />

            {/* ============================================================
                LISTA DE SITUAÇÕES
            ============================================================ */}
            <SituationList
                situacoes={situations}
                colaboradores={employees}
                tipos={types}
                onEditar={editSituation}
                onAtivar={activateSituation}
                onInativar={deactivateSituation}
            />
        </section>
    )
}
