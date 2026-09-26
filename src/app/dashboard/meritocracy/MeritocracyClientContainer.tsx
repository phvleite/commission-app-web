'use client'

import { useState } from 'react'
import { useMeritocracyClient } from './MeritocracyClient'
import type {
    MeritocracyAllocationItem,
    MeritocracyEmployeeItem,
    MeritocracySectorItem,
} from './MeritocracyClient'
import { MeritocracyLaunchForm } from './MeritocracyLaunchForm'
import { MeritocracyAllocationsList } from './MeritocracyAllocationsList'

interface Props {
    userRole: 'admin' | 'manager' | 'seller'
    initialSectors: MeritocracySectorItem[]
    initialEmployees: MeritocracyEmployeeItem[]
    initialAllocations: MeritocracyAllocationItem[]
}

export function MeritocracyClientContainer({
    userRole,
    initialSectors,
    initialEmployees,
    initialAllocations,
}: Props) {
    const [activeTab, setActiveTab] = useState<'launch' | 'consult'>('launch')
    const client = useMeritocracyClient({
        userRole,
        initialSectors,
        initialEmployees,
        initialAllocations,
    })

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 p-6 sm:p-8">
            <h1 className="gold-bar-title text-2xl font-bold">Meritocracia</h1>

            <div
                className="flex gap-2 border-b border-(--color-border)"
                role="tablist"
                aria-label="Meritocracia"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'launch'}
                    className={
                        activeTab === 'launch'
                            ? 'primary-button rounded-t-lg px-4 py-2'
                            : 'secondary-button rounded-t-lg px-4 py-2'
                    }
                    onClick={() => setActiveTab('launch')}
                >
                    Lançamento
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'consult'}
                    className={
                        activeTab === 'consult'
                            ? 'primary-button rounded-t-lg px-4 py-2'
                            : 'secondary-button rounded-t-lg px-4 py-2'
                    }
                    onClick={() => setActiveTab('consult')}
                >
                    Consulta
                </button>
            </div>

            {activeTab === 'launch' ? (
                <MeritocracyLaunchForm
                    canWrite={client.canWrite}
                    sectors={client.sectors}
                    employees={client.employees}
                    competence={client.competence}
                    setCompetence={client.setCompetence}
                    existingAllocationCompetence={
                        client.existingAllocationForCompetence?.competence ?? null
                    }
                    isEmployeeChecked={client.isEmployeeChecked}
                    isSectorFullySelected={client.isSectorFullySelected}
                    isSectorIndeterminate={client.isSectorIndeterminate}
                    toggleSector={client.toggleSector}
                    toggleEmployee={client.toggleEmployee}
                    isSubmitting={client.isSubmitting}
                    error={client.error}
                    success={client.success}
                    onSubmit={() => void client.launchAllocation()}
                    meritocracyPreview={client.meritocracyPreview}
                    isLoadingPreview={client.isLoadingPreview}
                    previewError={client.previewError}
                    onPreview={() => void client.loadMeritocracyPreview()}
                />
            ) : null}

            {activeTab === 'consult' ? (
                <div>
                    <h2 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                        Lançamentos
                    </h2>
                    <div className="mt-4">
                        <MeritocracyAllocationsList
                            canWrite={client.canWrite}
                            allocations={client.allocations}
                            cancellingId={client.cancellingId}
                            onCancel={(id, reason) => void client.cancelAllocation(id, reason)}
                            isGeneratingPdfId={client.isGeneratingPdfId}
                            onGeneratePdf={(allocation) =>
                                void client.generateAllocationPdf(allocation)
                            }
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )
}
