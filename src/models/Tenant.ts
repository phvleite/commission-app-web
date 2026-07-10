import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTimestamps } from '@/types'

export interface ITenant extends WithTimestamps {
    _id: Types.ObjectId
    name: string
    slug: string
    active: boolean
}

export type TenantDocument = ITenant & Document

const tenantSchema = new Schema<TenantDocument>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

export const Tenant = models.Tenant ?? model<TenantDocument>('Tenant', tenantSchema)
