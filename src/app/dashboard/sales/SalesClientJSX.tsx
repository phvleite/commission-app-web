'use client'

import { SalesForm } from './SalesForm'
import { SalesFilters } from './SalesFilter'
import { SalesList } from './SalesList'
import { SalesSectorsModal } from './SalesSectorModal'
import type { useSalesClient } from './SalesClient'

interface SalesClientJSXProps {
    client: ReturnType<typeof useSalesClient>
}

export function SalesClientJSX({ client }: SalesClientJSXProps) {
    return (
        <section>
            <SalesForm
                editId={client.editId}
                onSave={client.saveSale}
                onCancel={client.cancelEdit}
                isSaving={client.isSaving}
            />

            <SalesFilters
                startDate={client.startDate}
                endDate={client.endDate}
                setStartDate={client.setStartDate}
                setEndDate={client.setEndDate}
                clearFilters={client.clearFilters}
            />

            <SalesList
                sales={client.sales}
                onEdit={client.beginEdit}
                onOpenModal={client.openModal}
                isLoading={client.isLoading}
                currentPage={client.currentPage}
                totalPages={client.totalPages}
                totalItems={client.totalItems}
                pageSize={client.pageSize}
                canGoPrevious={client.canGoPrevious}
                canGoNext={client.canGoNext}
                onPreviousPage={client.goToPreviousPage}
                onNextPage={client.goToNextPage}
            />

            {client.modalDate && (
                <SalesSectorsModal date={client.modalDate} onClose={client.closeModal} />
            )}
        </section>
    )
}
