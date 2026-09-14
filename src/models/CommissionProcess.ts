import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant } from '@/types'

export type CommissionProcessStatus =
    'processing' | 'success' | 'failed' | 'cancelled' | 'network_lost'

export interface ICommissionProcess extends WithTenant {
    _id: Types.ObjectId
    date: Date
    status: CommissionProcessStatus
    startedAt: Date
    finishedAt?: Date
    errorCode?: string
    message?: string
}

export type CommissionProcessDocument = ICommissionProcess & Document

const commissionProcessSchema = new Schema<CommissionProcessDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        date: { type: Date, required: true, index: true },
        status: {
            type: String,
            enum: ['processing', 'success', 'failed', 'cancelled', 'network_lost'],
            required: true,
            default: 'processing',
            trim: true,
        },
        startedAt: { type: Date, required: true, default: Date.now },
        finishedAt: { type: Date },
        errorCode: { type: String, trim: true },
        message: { type: String, trim: true },
    },
    { timestamps: true },
)

commissionProcessSchema.index({ tenantId: 1, date: 1 }, { unique: true })

export const CommissionProcess =
    models.CommissionProcess ??
    model<CommissionProcessDocument>('CommissionProcess', commissionProcessSchema)
