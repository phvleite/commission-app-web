import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export interface ISector extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    name: string
    percentage: number
    active: boolean
    isMeritocracia: boolean
}

export type SectorDocument = ISector & Document

const sectorSchema = new Schema<SectorDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        name: { type: String, required: true, trim: true },
        percentage: { type: Number, required: true, min: 0, max: 100 },
        active: { type: Boolean, default: true },
        isMeritocracia: { type: Boolean, default: false },
    },
    { timestamps: true },
)

sectorSchema.index({ tenantId: 1, name: 1 }, { unique: true })

export const Sector = models.Sector ?? model<SectorDocument>('Sector', sectorSchema)
