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
    cnpj?: string
    responsibleUserId?: Types.ObjectId
    phoneCommercial?: string
    phoneMobile?: string
    phone?: string
    email?: string
    maxUsers: number
    timeZone?: string
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
        cnpj: { type: String, trim: true, uppercase: true },
        responsibleUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        phoneCommercial: { type: String, trim: true },
        phoneMobile: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        maxUsers: { type: Number, default: 3, min: 1 },
        timeZone: { type: String, default: 'America/Sao_Paulo', trim: true },
        address: { type: addressSchema },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

tenantSchema.index(
    { cnpj: 1 },
    {
        unique: true,
        sparse: true,
    },
)

export const Tenant = models.Tenant ?? model<TenantDocument>('Tenant', tenantSchema)
