import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export interface ISaleCommissionSector extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    date: Date
    sectorId: Types.ObjectId
    appliedPercentage: number
    /** Valor total do setor neste dia em centavos */
    totalSectorValue: number
    totalEmployees: number
    eligibleEmployees: number
}

export type SaleCommissionSectorDocument = ISaleCommissionSector & Document

const saleCommissionSectorSchema = new Schema<SaleCommissionSectorDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        date: { type: Date, required: true },
        sectorId: { type: Schema.Types.ObjectId, ref: 'Sector', required: true },
        appliedPercentage: { type: Number, required: true, min: 0, max: 100 },
        totalSectorValue: { type: Number, required: true, min: 0 },
        totalEmployees: { type: Number, required: true, min: 0 },
        eligibleEmployees: { type: Number, required: true, min: 0 },
    },
    { timestamps: true },
)

saleCommissionSectorSchema.index({ tenantId: 1, date: 1, sectorId: 1 }, { unique: true })

export const SaleCommissionSector =
    models.SaleCommissionSector ??
    model<SaleCommissionSectorDocument>('SaleCommissionSector', saleCommissionSectorSchema)
