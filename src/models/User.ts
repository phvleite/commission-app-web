import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'
import { Tenant } from './Tenant'

export type UserRole = 'admin' | 'manager' | 'seller'
const DEFAULT_MAX_USERS_PER_TENANT = 3

export interface IUser extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    name: string
    email: string
    cpf?: string
    phone?: string
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
        cpf: { type: String, trim: true },
        phone: { type: String, trim: true },
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

    const tenant = await Tenant.findById(this.tenantId).select('maxUsers').lean()
    const maxUsers = tenant?.maxUsers ?? DEFAULT_MAX_USERS_PER_TENANT

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
        throw new Error(`Limite de ${maxUsers} usuarios por tenant no pacote basico.`)
    }
})

export const User = models.User ?? model<UserDocument>('User', userSchema)
