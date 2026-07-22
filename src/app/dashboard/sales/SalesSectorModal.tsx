'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'
import { formatDateFromDatabase } from '@/utils/formatDate'

interface SalesSectorsModalProps {
    date: string
    onClose: () => void
}

interface SectorInfo {
    _id: string
    sectorId: string
    sectorName: string
    appliedPercentage: number
    totalSectorValue: number
    totalEmployees: number
    eligibleEmployees: number
}

export function SalesSectorsModal({ date, onClose }: SalesSectorsModalProps) {
    const [sectors, setSectors] = useState<SectorInfo[]>([])

    useEffect(() => {
        async function loadSectors() {
            try {
                const res = await fetch(`/api/commissions/sectors?date=${date}`)
                const json = await res.json()

                if (!res.ok) {
                    toast.error(json.error ?? 'Erro ao carregar setores.')
                    return
                }

                setSectors(json.sectors)
            } catch {
                toast.error('Erro ao carregar setores.')
            }
        }

        loadSectors()
    }, [date])

    return (
        <div className="gold-bar-title fixed inset-0 bg-black/40 flex items-center justify-center z-9950 p-4">
            <div className="panel p-6 rounded-xl border border-(--color-border) bg-surface w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                <h3 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                    Comissões por Setor — {formatDateFromDatabase(date)}
                </h3>

                <hr className="my-6" />

                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-150">
                        <thead>
                            <tr className="text-left border-b border-(--color-border) bg-surface-soft">
                                <th className="py-2 text-center">Setor</th>
                                <th className="py-2 text-center">Percentual</th>
                                <th className="py-2 text-center">Valor Total</th>
                                <th className="py-2 text-center">Total Colaboradores</th>
                                <th className="py-2 text-center">Aptos</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sectors.map((s) => (
                                <tr key={s._id} className="border-b border-(--color-border)">
                                    <td className="py-2">{s.sectorName}</td>
                                    <td className="py-2 text-center">{s.appliedPercentage}%</td>
                                    <td className="py-2 text-right">
                                        R$ {formatCurrencyFromDatabase(s.totalSectorValue)}
                                    </td>
                                    <td className="py-2 text-center">{s.totalEmployees}</td>
                                    <td className="py-2 text-center">{s.eligibleEmployees}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                     <button
                        className="cancel-button px-5 py-3 rounded-xl"
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    )
}
