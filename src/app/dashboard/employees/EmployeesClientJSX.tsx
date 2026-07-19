'use client'

import { EmployeesFilters } from './EmployeesFilters'
import { EmployeesForm } from './EmployeesForm'
import { EmployeesList } from './EmployeesList'

export function EmployeesClientJSX(
    props: ReturnType<typeof import('./EmployeesClient').EmployeesClient>,
) {
    const {
        employees,
        sectors,
        error,
        success,
        canWrite,

        filterStatus,
        filterSector,
        orderBy,
        search,

        setFilterStatus,
        setFilterSector,
        setOrderBy,
        setSearch,
        clearFilters,

        name,
        sectorId,
        admissionDate,
        dismissalDate,

        setName,
        setSectorId,
        setAdmissionDate,
        setDismissalDate,

        editingId,
        editName,
        editSectorId,
        editAdmissionDate,
        editDismissalDate,

        startEdit,
        cancelEdit,
        handleCreateEmployee,
        handleSaveEdition,

        setEditName,
        setEditSectorId,
        setEditAdmissionDate,
        setEditDismissalDate,

        showForm,
        setShowForm,
        filteredEmployeesCount,
    } = props

    return (
        <section className="panel mx-auto w-full max-w-5xl p-6 sm:p-8">
            {/* Título */}
            <h1 className="gold-bar-title mt-2 text-3xl font-semibold text-(--color-primary-strong)">
                Colaboradores
            </h1>

            <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                Gerencie os colaboradores da empresa. Você pode filtrar, adicionar, editar ou
                inativar colaboradores conforme necessário.
            </p>


            {/* Botão Novo Colaborador */}
            {canWrite ? (
                <div className="mt-6 flex justify-start">
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                    >
                        {showForm ? 'Fechar' : 'Novo colaborador'}
                    </button>
                </div>
            ) : null}

            {/* Card Novo Colaborador */}
            {showForm ? (
                <div className="mt-6 rounded-xl border border-(--color-border) bg-white p-6">
                    <h2 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                        Novo Colaborador
                    </h2>

                    <EmployeesForm
                        name={name}
                        sectorId={sectorId}
                        admissionDate={admissionDate}
                        dismissalDate={dismissalDate}
                        sectors={sectors}
                        canWrite={canWrite}
                        setName={setName}
                        setSectorId={setSectorId}
                        setAdmissionDate={setAdmissionDate}
                        setDismissalDate={setDismissalDate}
                        handleCreateEmployee={handleCreateEmployee}
                        onCancel={() => setShowForm(false)}
                    />
               </div>
            ) : null}

            {/* Mensagens */}
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

            {/* Filtros */}
            <EmployeesFilters
                filterStatus={filterStatus}
                filterSector={filterSector}
                orderBy={orderBy}
                search={search}
                sectors={sectors}
                setFilterStatus={setFilterStatus}
                setFilterSector={setFilterSector}
                setOrderBy={setOrderBy}
                setSearch={setSearch}
                clearFilters={clearFilters}
                filteredEmployeesCount={filteredEmployeesCount}
            />

            {/* Lista */}
            <EmployeesList
                employees={employees}
                sectors={sectors}
                filterStatus={filterStatus}
                filterSector={filterSector}
                orderBy={orderBy}
                search={search}
                editingId={editingId}
                editName={editName}
                editSectorId={editSectorId}
                editAdmissionDate={editAdmissionDate}
                editDismissalDate={editDismissalDate}
                canWrite={canWrite}
                startEdit={startEdit}
                cancelEdit={cancelEdit}
                handleSaveEdition={handleSaveEdition}
                setEditName={setEditName}
                setEditSectorId={setEditSectorId}
                setEditAdmissionDate={setEditAdmissionDate}
                setEditDismissalDate={setEditDismissalDate}
            />
        </section>
    )
}
