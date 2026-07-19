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

    // ===========================
    // CARREGAR SETORES DO DIA
    // ===========================
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="panel p-6 rounded-xl border border-(--color-border) bg-white w-full max-w-3xl">

                <h3 className="text-xl font-semibold text-(--color-primary-strong)">
                    Comissões por Setor — {formatDateFromDatabase(date)}
                </h3>

                <hr className="my-6" />

                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-(--color-border)">
                            <th className="py-2">Setor</th>
                            <th className="py-2">Percentual</th>
                            <th className="py-2">Valor Total</th>
                            <th className="py-2">Total Colaboradores</th>
                            <th className="py-2">Aptos</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sectors.map((s) => (
                            <tr key={s._id} className="border-b border-(--color-border)">
                                <td className="py-2">{s.sectorName}</td>
                                <td className="py-2">{s.appliedPercentage}%</td>
                                <td className="py-2">
                                    R$ {formatCurrencyFromDatabase(s.totalSectorValue)}
                                </td>
                                <td className="py-2">{s.totalEmployees}</td>
                                <td className="py-2">{s.eligibleEmployees}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-6 flex justify-end">
                    <button
                        className="secondary-button px-5 py-3 rounded-xl"
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    )
}
