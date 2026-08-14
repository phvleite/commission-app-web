import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTimestamps } from '@/types'
import {
    DEFAULT_SERVICE_PLAN_CODE,
    getServicePlan,
    getResolvedServicePlan,
    isServicePlanCode,
    SERVICE_PLAN_ORDER,
    type ServicePlanCode,
} from '@/lib/service-plans'

export const TENANT_BILLING_STATUS = [
    'pending',
    'active',
    'overdue',
    'suspended',
    'canceled',
] as const

export type TenantBillingStatus = (typeof TENANT_BILLING_STATUS)[number]

export const TENANT_DISCOUNT_CODES = ['abrasel'] as const

export type TenantDiscountCode = (typeof TENANT_DISCOUNT_CODES)[number]

export interface IAddress {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
}

export interface ITenantDiscount {
    code: TenantDiscountCode | (string & {})
    percentage: number
    isAbrasel?: boolean
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
    planCode: ServicePlanCode
    discounts: ITenantDiscount[]
    billingStatus: TenantBillingStatus
    nextBillingAt?: Date
    monthlyPriceOverrideCents?: number
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

const tenantDiscountSchema = new Schema<ITenantDiscount>(
    {
        code: { type: String, required: true, trim: true, lowercase: true },
        percentage: { type: Number, required: true, min: 0, max: 100 },
        isAbrasel: { type: Boolean },
    },
    { _id: false },
)

function applyPlanDerivedValues(target: { planCode?: unknown; maxUsers?: unknown }) {
    if (typeof target.planCode !== 'string' || !isServicePlanCode(target.planCode)) {
        return
    }

    target.maxUsers = getServicePlan(target.planCode).maxUsers
}

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
        planCode: {
            type: String,
            enum: [...SERVICE_PLAN_ORDER],
            default: DEFAULT_SERVICE_PLAN_CODE,
            required: true,
            trim: true,
        },
        discounts: {
            type: [tenantDiscountSchema],
            default: [],
        },
        billingStatus: {
            type: String,
            enum: [...TENANT_BILLING_STATUS],
            default: 'pending',
            required: true,
            trim: true,
        },
        nextBillingAt: { type: Date },
        monthlyPriceOverrideCents: { type: Number, min: 0 },
        maxUsers: {
            type: Number,
            default: getServicePlan(DEFAULT_SERVICE_PLAN_CODE).maxUsers,
            min: 1,
        },
        timeZone: { type: String, default: 'America/Sao_Paulo', trim: true },
        address: { type: addressSchema },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

tenantSchema.pre('validate', function syncPlanDerivedValuesOnValidate() {
    applyPlanDerivedValues(this)
})

tenantSchema.pre('findOneAndUpdate', async function syncPlanDerivedValuesOnUpdate() {
    const currentUpdate = this.getUpdate()

    if (!currentUpdate || Array.isArray(currentUpdate)) {
        return
    }

    const update = currentUpdate as {
        planCode?: unknown
        maxUsers?: unknown
        $set?: { planCode?: unknown; maxUsers?: unknown }
    }

    const setData = update.$set ?? update
    const currentTenant = await this.model
        .findOne(this.getQuery())
        .select('planCode')
        .lean<{ planCode?: string }>()

    setData.planCode =
        typeof setData.planCode === 'string'
            ? setData.planCode
            : typeof update.planCode === 'string'
              ? update.planCode
              : (currentTenant?.planCode ?? DEFAULT_SERVICE_PLAN_CODE)

    setData.maxUsers = getResolvedServicePlan(
        typeof setData.planCode === 'string' ? setData.planCode : null,
    ).maxUsers

    if (update.$set) {
        update.$set = setData
    }

    this.setUpdate(update)
})

tenantSchema.index(
    { cnpj: 1 },
    {
        unique: true,
        sparse: true,
    },
)

export const Tenant = models.Tenant ?? model<TenantDocument>('Tenant', tenantSchema)
