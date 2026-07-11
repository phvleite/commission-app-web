import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export type UserRole = 'admin' | 'manager' | 'seller'
const MAX_USERS_PER_TENANT_BASIC = 2

export interface IUser extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    name: string
    email: string
    passwordHash: string
    role: UserRole
    active: boolean
}

export type UserDocument = IUser & Document

const userSchema = new Schema<UserDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['admin', 'manager', 'seller'], default: 'seller' },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

userSchema.index({ tenantId: 1, email: 1 }, { unique: true })

userSchema.pre('save', async function preSaveUserLimit() {
    if (!this.isNew) {
        return
    }

    const totalUsers = await (this.constructor as typeof User).countDocuments({
        tenantId: this.tenantId,
    })

    if (totalUsers >= MAX_USERS_PER_TENANT_BASIC) {
        throw new Error('Limite de 2 usuarios por tenant no pacote basico.')
    }
})

export const User = models.User ?? model<UserDocument>('User', userSchema)
