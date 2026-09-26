import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import { MeritocracyAllocationError } from '@/services/meritocracy/generateMeritocracyAllocation'

export interface CancelMeritocracyAllocationInput {
    tenantId: string
    allocationId: string
    reason: string
    cancelledBy?: string
}

export async function cancelMeritocracyAllocation(input: CancelMeritocracyAllocationInput) {
    await connectDB()

    const reason = input.reason?.trim()
    if (!reason) {
        throw new MeritocracyAllocationError(
            'CANCEL_REASON_REQUIRED',
            'Informe o motivo do cancelamento.',
        )
    }

    const allocation = await MeritocracyAllocation.findOne({
        _id: input.allocationId,
        tenantId: input.tenantId,
    })

    if (!allocation) {
        throw new MeritocracyAllocationError(
            'ALLOCATION_NOT_FOUND',
            'Lançamento de meritocracia não encontrado.',
        )
    }

    if (allocation.status === 'cancelled') {
        throw new MeritocracyAllocationError(
            'ALLOCATION_ALREADY_CANCELLED',
            'Este lançamento já foi cancelado.',
        )
    }

    allocation.status = 'cancelled'
    allocation.cancelReason = reason
    allocation.cancelledAt = new Date()
    allocation.cancelledBy =
        input.cancelledBy && Types.ObjectId.isValid(input.cancelledBy)
            ? new Types.ObjectId(input.cancelledBy)
            : undefined

    await allocation.save()
    return allocation
}
