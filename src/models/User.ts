import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'
import { getResolvedServicePlan } from '@/lib/service-plans'
import { Tenant } from './Tenant'

export type UserRole = 'admin' | 'manager' | 'seller'
export type PlatformRole = 'platform_owner' | 'platform_admin' | 'platform_auditor'

export interface IUser extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    name: string
    email: string
    cpf?: string
    phone?: string
    passwordHash: string
    role: UserRole
    platformRole?: PlatformRole
    active: boolean
}

export type UserDocument = IUser & Document

const userSchema = new Schema<UserDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        cpf: { type: String, trim: true },
        phone: { type: String, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['admin', 'manager', 'seller'], default: 'seller' },
        platformRole: {
            type: String,
            enum: ['platform_owner', 'platform_admin', 'platform_auditor'],
            required: false,
        },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

userSchema.index({ tenantId: 1, email: 1 }, { unique: true })

userSchema.pre('save', async function preSaveUserLimit() {
    if (!this.isNew) {
        return
    }

    const tenant = await Tenant.findById(this.tenantId).select('planCode').lean()
    const maxUsers = getResolvedServicePlan(tenant?.planCode).maxUsers

    const userModel = models.User as
        | {
              countDocuments: (filter: { tenantId: Types.ObjectId }) => Promise<number>
          }
        | undefined

    if (!userModel) {
        return
    }

    const totalUsers = await userModel.countDocuments({
        tenantId: this.tenantId,
    })

    if (totalUsers >= maxUsers) {
        throw new Error(`Limite de ${maxUsers} usuarios por tenant para o plano atual.`)
    }
})

export const User = models.User ?? model<UserDocument>('User', userSchema)
