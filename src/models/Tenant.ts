import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTimestamps } from '@/types'

export interface IAddress {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
}

export interface ITenant extends WithTimestamps {
    _id: Types.ObjectId
    name: string
    legalName: string
    slug: string
    address?: IAddress
    active: boolean
}

export type TenantDocument = ITenant & Document

const addressSchema = new Schema<IAddress>(
    {
        street: { type: String, required: true, trim: true },
        number: { type: String, required: true, trim: true },
        neighborhood: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true, uppercase: true, maxlength: 2 },
        zipCode: { type: String, required: true, trim: true },
    },
    { _id: false },
)

const tenantSchema = new Schema<TenantDocument>(
    {
        name: { type: String, required: true, trim: true },
        legalName: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        address: { type: addressSchema },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

export const Tenant = models.Tenant ?? model<TenantDocument>('Tenant', tenantSchema)
