import { Document, model, models, Schema, Types } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export interface IEmployeeSectorHistory extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    employeeId: Types.ObjectId
    sectorId: Types.ObjectId
    startDate: Date
    endDate?: Date
    createdBy?: Types.ObjectId
}

export type EmployeeSectorHistoryDocument = IEmployeeSectorHistory & Document

const employeeSectorHistorySchema = new Schema<EmployeeSectorHistoryDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
        sectorId: { type: Schema.Types.ObjectId, ref: 'Sector', required: true, index: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
)

employeeSectorHistorySchema.pre('validate', function validatePeriod() {
    if (this.endDate && this.endDate < this.startDate) {
        this.invalidate('endDate', 'A data final não pode ser anterior à data inicial.')
    }
})

employeeSectorHistorySchema.index({ tenantId: 1, employeeId: 1, startDate: 1 }, { unique: true })
employeeSectorHistorySchema.index(
    { tenantId: 1, employeeId: 1 },
    { unique: true, partialFilterExpression: { endDate: { $exists: false } } },
)

export const EmployeeSectorHistory =
    models.EmployeeSectorHistory ??
    model<EmployeeSectorHistoryDocument>('EmployeeSectorHistory', employeeSectorHistorySchema)
