import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export interface ISituation extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    employeeId: Types.ObjectId
    typeId: Types.ObjectId
    startDate: Date
    endDate: Date
    active: boolean
}

export type SituationDocument = ISituation & Document

const situationSchema = new Schema<SituationDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
        typeId: { type: Schema.Types.ObjectId, ref: 'SituationType', required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

situationSchema.index({ tenantId: 1, employeeId: 1, startDate: 1 })

export const Situation = models.Situation ?? model<SituationDocument>('Situation', situationSchema)
