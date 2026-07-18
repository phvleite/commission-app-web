'use client'

import { SalesForm } from './SalesForm'
import { SalesFilters } from './SalesFilter'
import { SalesList } from './SalesList'
import { SalesSectorsModal } from './SalesSectorModal'

export function SalesClientJSX(client: ReturnType<typeof import('./SalesClient').SalesClient>) {
    return (
        <section className="panel mx-auto w-full max-w-4xl p-6 sm:p-8">
            {/* ===========================
                FORMULÁRIO
            ============================ */}
            <SalesForm
                editId={client.editId}
                onSave={client.saveSale}
                onCancel={client.cancelEdit}
            />

            <hr className="my-8" />

            {/* ===========================
                FILTROS POR PERÍODO
            ============================ */}
            <SalesFilters
                startDate={client.startDate}
                endDate={client.endDate}
                setStartDate={client.setStartDate}
                setEndDate={client.setEndDate}
                clearFilters={client.clearFilters}
            />

            <hr className="my-8" />

            {/* ===========================
                LISTA DE VENDAS
            ============================ */}
            <SalesList
                sales={client.sales}
                onEdit={client.beginEdit}
                onOpenModal={client.openModal}
            />

            {/* ===========================
                MODAL DE SETORES
            ============================ */}
            {client.modalDate && (
                <SalesSectorsModal date={client.modalDate} onClose={client.closeModal} />
            )}
        </section>
    )
}
