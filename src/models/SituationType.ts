import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export interface ISituationType extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    description: string
    active: boolean
}

export type SituationTypeDocument = ISituationType & Document

const situationTypeSchema = new Schema<SituationTypeDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        description: { type: String, required: true, trim: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

situationTypeSchema.index({ tenantId: 1, description: 1 }, { unique: true })

export const SituationType =
    models.SituationType ?? model<SituationTypeDocument>('SituationType', situationTypeSchema)
