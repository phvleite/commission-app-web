'use client'

import { useState } from 'react'
import { formatCurrencyFromDatabase } from '@/utils/formatCurrency'
import type { MeritocracyAllocationItem } from './MeritocracyClient'

interface Props {
    canWrite: boolean
    allocations: MeritocracyAllocationItem[]
    cancellingId: string | null
    onCancel: (allocationId: string, reason: string) => void
    isGeneratingPdfId: string | null
    onGeneratePdf: (allocation: MeritocracyAllocationItem) => void
}

const MONTH_NAMES = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
]

function formatCompetence(competence: string): string {
    const [year, month] = competence.split('-')
    if (!year || !month) return competence
    return `${MONTH_NAMES[Number(month) - 1] ?? month}/${year}`
}

function formatDateBr(value: string): string {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(parsed)
}

export function MeritocracyAllocationsList({
    canWrite,
    allocations,
    cancellingId,
    onCancel,
    isGeneratingPdfId,
    onGeneratePdf,
}: Props) {
    const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
    const [cancelReason, setCancelReason] = useState('')
    const [expandedAllocationId, setExpandedAllocationId] = useState<string | null>(null)

    function startCancel(allocationId: string) {
        setCancelTargetId(allocationId)
        setCancelReason('')
    }

    function confirmCancel() {
        if (!cancelTargetId || !cancelReason.trim()) return
        onCancel(cancelTargetId, cancelReason.trim())
        setCancelTargetId(null)
        setCancelReason('')
    }

    if (allocations.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-(--color-border) bg-surface-soft p-6 text-center text-sm text-(--color-primary-weak)">
                Nenhum lançamento de meritocracia encontrado.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {allocations.map((allocation) => (
                <div
                    key={allocation._id}
                    className={`${
                        allocation.status === 'cancelled' ? 'danger-bar-title' : 'gold-bar-title'
                    } rounded-xl border border-(--color-border) bg-white p-4`}
                >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-sm font-semibold text-(--color-primary-strong)">
                                {formatCompetence(allocation.competence)}
                            </p>
                            <p className="text-xs text-(--color-muted)">
                                Pagamento: {formatDateBr(allocation.paymentDate)} | Colaboradores:{' '}
                                {allocation.recipientCount}
                            </p>
                            <p className="text-xs text-(--color-muted)">
                                Total: R${' '}
                                {formatCurrencyFromDatabase(allocation.totalMeritocracyValue)}
                            </p>
                            <p className="text-xs text-(--color-muted)">
                                Status: {allocation.status === 'success' ? 'Ativo' : 'Cancelado'}
                                {allocation.cancelReason ? ` — ${allocation.cancelReason}` : ''}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="secondary-button rounded-lg px-3 py-2 text-xs font-semibold"
                                onClick={() =>
                                    setExpandedAllocationId((current) =>
                                        current === allocation._id ? null : allocation._id,
                                    )
                                }
                            >
                                {expandedAllocationId === allocation._id
                                    ? 'Ocultar contemplados'
                                    : 'Ver contemplados'}
                            </button>
                            <button
                                type="button"
                                className="secondary-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                onClick={() => onGeneratePdf(allocation)}
                                disabled={isGeneratingPdfId === allocation._id}
                            >
                                {isGeneratingPdfId === allocation._id
                                    ? 'Gerando PDF...'
                                    : 'Gerar relatório'}
                            </button>

                            {canWrite && allocation.status === 'success' ? (
                                <button
                                    type="button"
                                    className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                    onClick={() => startCancel(allocation._id)}
                                    disabled={cancellingId === allocation._id}
                                >
                                    {cancellingId === allocation._id
                                        ? 'Cancelando...'
                                        : 'Cancelar lançamento'}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {expandedAllocationId === allocation._id ? (
                        <div className="mt-4 space-y-4 border-t border-(--color-border) pt-4">
                            <div>
                                <h3 className="text-sm font-semibold text-(--color-primary-strong)">
                                    Colaboradores contemplados
                                </h3>
                                <div className="mt-2 overflow-x-auto">
                                    <table className="w-full min-w-125 text-sm">
                                        <thead>
                                            <tr className="border-b border-(--color-border) bg-surface-soft">
                                                <th className="px-3 py-2 text-left">Colaborador</th>
                                                <th className="px-3 py-2 text-left">Setor</th>
                                                <th className="px-3 py-2 text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...allocation.recipients]
                                                .sort((a, b) =>
                                                    a.employeeName.localeCompare(
                                                        b.employeeName,
                                                        'pt-BR',
                                                    ),
                                                )
                                                .map((recipient) => (
                                                    <tr
                                                        key={recipient.employeeId}
                                                        className="border-b border-(--color-border)"
                                                    >
                                                        <td className="px-3 py-2">
                                                            {recipient.employeeName}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {recipient.sectorName}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            R${' '}
                                                            {formatCurrencyFromDatabase(
                                                                recipient.employeeValue,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {allocation.ignoredEmployees?.length ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                    <p className="font-semibold">
                                        Colaboradores ignorados no período
                                    </p>
                                    <ul className="mt-1 list-disc pl-5">
                                        {allocation.ignoredEmployees.map((employee) => (
                                            <li key={employee.employeeId}>
                                                {employee.employeeName}: {employee.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {cancelTargetId === allocation._id ? (
                        <div className="mt-3 space-y-2 border-t border-(--color-border) pt-3">
                            <label className="text-xs font-semibold text-(--color-muted)">
                                Motivo do cancelamento
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(event) => setCancelReason(event.target.value)}
                                className="w-full rounded-lg border border-(--color-border) bg-surface-soft px-3 py-2 text-sm"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="primary-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                    onClick={confirmCancel}
                                    disabled={!cancelReason.trim()}
                                >
                                    Confirmar cancelamento
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold"
                                    onClick={() => setCancelTargetId(null)}
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            ))}
        </div>
    )
}
