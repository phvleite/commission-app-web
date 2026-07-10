import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export interface IEmployee extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    name: string
    sectorId: Types.ObjectId
    admissionDate: Date
    dismissalDate?: Date
    active: boolean
}

export type EmployeeDocument = IEmployee & Document

const employeeSchema = new Schema<EmployeeDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        name: { type: String, required: true, trim: true },
        sectorId: { type: Schema.Types.ObjectId, ref: 'Sector', required: true, index: true },
        admissionDate: { type: Date, required: true },
        dismissalDate: { type: Date },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
)

employeeSchema.index({ tenantId: 1, name: 1 })

export const Employee = models.Employee ?? model<EmployeeDocument>('Employee', employeeSchema)
