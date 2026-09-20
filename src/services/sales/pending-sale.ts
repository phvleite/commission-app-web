import { CommissionProcess, type CommissionProcessStatus } from '@/models/CommissionProcess'
import { Sale } from '@/models/Sale'

export const PENDING_SALE_STALE_AFTER_MS = 2 * 60 * 1000

export interface PendingSale {
    date: Date
    value: number
    totalCommissionValue: number
    status: CommissionProcessStatus | 'process_not_found'
    startedAt: Date
    recoverable: boolean
}

export async function findPendingSale(
    tenantId: string,
    now = new Date(),
): Promise<PendingSale | null> {
    const processes = await CommissionProcess.find({
        tenantId,
        status: { $ne: 'success' },
    })
        .sort({ startedAt: 1 })
        .lean()

    for (const process of processes) {
        const sale = await Sale.findOne({ tenantId, date: process.date }).lean()
        if (!sale) continue

        const recoverable =
            process.status !== 'processing' ||
            now.getTime() - process.startedAt.getTime() >= PENDING_SALE_STALE_AFTER_MS

        return {
            date: sale.date,
            value: sale.value,
            totalCommissionValue: sale.totalCommissionValue,
            status: process.status,
            startedAt: process.startedAt,
            recoverable,
        }
    }

    const sales = await Sale.find({ tenantId }).sort({ createdAt: 1 }).lean()
    for (const sale of sales) {
        const process = await CommissionProcess.exists({ tenantId, date: sale.date })
        if (process) continue

        const startedAt = sale.createdAt
        return {
            date: sale.date,
            value: sale.value,
            totalCommissionValue: sale.totalCommissionValue,
            status: 'process_not_found',
            startedAt,
            recoverable: now.getTime() - startedAt.getTime() >= PENDING_SALE_STALE_AFTER_MS,
        }
    }

    return null
}
