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
            />

            {client.modalDate && (
                <SalesSectorsModal date={client.modalDate} onClose={client.closeModal} />
            )}
        </section>
    )
}
