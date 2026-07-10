import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export interface ICommission extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    date: Date
    employeeId: Types.ObjectId
    sectorId: Types.ObjectId
    /** Snapshot da situação do colaborador neste dia (ex: "Apto", "Férias") */
    situation: string
    /** Valor total do setor neste dia em centavos */
    sectorValue: number
    /** Valor do colaborador neste dia em centavos */
    employeeValue: number
    eligibleCount: number
    totalCount: number
}

export type CommissionDocument = ICommission & Document

const commissionSchema = new Schema<CommissionDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        date: { type: Date, required: true },
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
        sectorId: { type: Schema.Types.ObjectId, ref: 'Sector', required: true },
        situation: { type: String, required: true, trim: true },
        sectorValue: { type: Number, required: true, min: 0 },
        employeeValue: { type: Number, required: true, min: 0 },
        eligibleCount: { type: Number, required: true, min: 0 },
        totalCount: { type: Number, required: true, min: 0 },
    },
    { timestamps: true },
)

commissionSchema.index({ tenantId: 1, date: 1, employeeId: 1 }, { unique: true })
commissionSchema.index({ tenantId: 1, date: 1 })

export const Commission =
    models.Commission ?? model<CommissionDocument>('Commission', commissionSchema)
