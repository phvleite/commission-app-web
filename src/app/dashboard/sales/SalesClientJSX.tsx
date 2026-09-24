'use client'

import { useEffect, useRef } from 'react'
import { SalesForm } from './SalesForm'
import { SalesFilters } from './SalesFilter'
import { SalesList } from './SalesList'
import { SalesSectorsModal } from './SalesSectorModal'
import type { useSalesClient } from './SalesClient'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'

interface SalesClientJSXProps {
    client: ReturnType<typeof useSalesClient>
}

export function SalesClientJSX({ client }: SalesClientJSXProps) {
    const formSectionRef = useRef<HTMLDivElement>(null)
    const pendingDate = client.pendingSale
        ? client.pendingSale.date.slice(0, 10).split('-').reverse().join('/')
        : ''

    useEffect(() => {
        if (!client.editId) return

        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [client.editId])

    return (
        <section>
            {client.pendingSale ? (
                <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950">
                    <h2 className="text-lg font-semibold">Lançamento pendente encontrado</h2>
                    <p className="mt-2 text-sm leading-6">
                        A venda de <strong>{pendingDate}</strong>, no valor de{' '}
                        <strong>R$ {formatCurrencyFromDatabase(client.pendingSale.value)}</strong>,
                        não teve o processamento confirmado.
                    </p>
                    {client.pendingSale.recoverable ? (
                        <>
                            <p className="mt-2 text-sm leading-6">
                                Deseja concluir o lançamento original ou desconsiderá-lo?
                            </p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    className="primary-button px-4 py-3 disabled:opacity-70"
                                    disabled={client.isResolvingPending}
                                    onClick={() => void client.resolvePendingSale('complete')}
                                >
                                    Concluir lançamento
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button px-4 py-3 disabled:opacity-70"
                                    disabled={client.isResolvingPending}
                                    onClick={() => void client.resolvePendingSale('discard')}
                                >
                                    Desconsiderar lançamento
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="mt-2 text-sm leading-6">
                            O processamento ainda pode estar em andamento. Aguarde alguns instantes;
                            as opções de recuperação serão liberadas automaticamente.
                        </p>
                    )}
                </div>
            ) : null}

            <div ref={formSectionRef}>
                <SalesForm
                    editId={client.editId}
                    onSave={client.saveSale}
                    onCancel={client.cancelEdit}
                    isSaving={client.isSaving}
                    isBlocked={Boolean(client.pendingSale)}
                />
            </div>

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
