import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export interface ISale extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    /** Data da venda — única por tenant */
    date: Date
    /** Valor total da venda em centavos */
    value: number
    /** 10% do valor — pool de comissão do dia (em centavos) */
    totalCommissionValue: number
}

export type SaleDocument = ISale & Document

const saleSchema = new Schema<SaleDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        date: { type: Date, required: true },
        value: { type: Number, required: true, min: 0 },
        totalCommissionValue: { type: Number, required: true, min: 0 },
    },
    { timestamps: true },
)

saleSchema.index({ tenantId: 1, date: 1 }, { unique: true })

export const Sale = models.Sale ?? model<SaleDocument>('Sale', saleSchema)
