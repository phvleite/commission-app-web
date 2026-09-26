import { Schema, model, models, Types, Document } from 'mongoose'
import type { WithTenant, WithTimestamps } from '@/types'

export type MeritocracyAllocationStatus = 'success' | 'cancelled'

export interface IMeritocracyRecipient {
    employeeId: Types.ObjectId
    employeeName: string
    sectorId: Types.ObjectId
    sectorName: string
    /** Valor recebido pelo colaborador em centavos */
    employeeValue: number
}

export interface IMeritocracyIgnoredEmployee {
    employeeId: Types.ObjectId
    employeeName: string
    reason: string
}

export interface IMeritocracyAllocation extends WithTenant, WithTimestamps {
    _id: Types.ObjectId
    /** Competência no formato "YYYY-MM" */
    competence: string
    periodStart: Date
    periodEnd: Date
    /** Último dia do mês da competência */
    paymentDate: Date
    meritocracySectorId: Types.ObjectId
    /** Total apurado em SaleCommissionSector para a competência, em centavos */
    totalMeritocracyValue: number
    recipientCount: number
    selectedSectorIds: Types.ObjectId[]
    explicitlyIncludedEmployeeIds: Types.ObjectId[]
    explicitlyExcludedEmployeeIds: Types.ObjectId[]
    recipients: IMeritocracyRecipient[]
    ignoredEmployees?: IMeritocracyIgnoredEmployee[]
    status: MeritocracyAllocationStatus
    createdBy?: Types.ObjectId
    cancelReason?: string
    cancelledAt?: Date
    cancelledBy?: Types.ObjectId
}

export type MeritocracyAllocationDocument = IMeritocracyAllocation & Document

const meritocracyRecipientSchema = new Schema<IMeritocracyRecipient>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        employeeName: { type: String, required: true, trim: true },
        sectorId: { type: Schema.Types.ObjectId, ref: 'Sector', required: true },
        sectorName: { type: String, required: true, trim: true },
        employeeValue: { type: Number, required: true, min: 0 },
    },
    { _id: false },
)

const meritocracyIgnoredEmployeeSchema = new Schema<IMeritocracyIgnoredEmployee>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        employeeName: { type: String, required: true, trim: true },
        reason: { type: String, required: true, trim: true },
    },
    { _id: false },
)

const meritocracyAllocationSchema = new Schema<MeritocracyAllocationDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        competence: {
            type: String,
            required: true,
            trim: true,
            match: /^\d{4}-(0[1-9]|1[0-2])$/,
        },
        periodStart: { type: Date, required: true },
        periodEnd: { type: Date, required: true },
        paymentDate: { type: Date, required: true },
        meritocracySectorId: { type: Schema.Types.ObjectId, ref: 'Sector', required: true },
        totalMeritocracyValue: { type: Number, required: true, min: 0 },
        recipientCount: { type: Number, required: true, min: 1 },
        selectedSectorIds: [{ type: Schema.Types.ObjectId, ref: 'Sector' }],
        explicitlyIncludedEmployeeIds: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
        explicitlyExcludedEmployeeIds: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
        recipients: {
            type: [meritocracyRecipientSchema],
            required: true,
            validate: {
                validator: (value: IMeritocracyRecipient[]) => value.length > 0,
                message: 'A meritocracia precisa de ao menos um destinatário.',
            },
        },
        ignoredEmployees: { type: [meritocracyIgnoredEmployeeSchema], default: [] },
        status: {
            type: String,
            enum: ['success', 'cancelled'],
            required: true,
            default: 'success',
            trim: true,
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        cancelReason: { type: String, trim: true },
        cancelledAt: { type: Date },
        cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
)

meritocracyAllocationSchema.pre('validate', function validateRecipientsTotal() {
    const sum = this.recipients.reduce((total, recipient) => total + recipient.employeeValue, 0)

    if (sum !== this.totalMeritocracyValue) {
        this.invalidate(
            'recipients',
            'A soma dos valores dos destinatários deve ser igual ao total da meritocracia.',
        )
    }

    if (this.recipients.length !== this.recipientCount) {
        this.invalidate(
            'recipientCount',
            'recipientCount deve corresponder à quantidade de destinatários.',
        )
    }
})

// Apenas um lançamento "success" por competência; cancelado libera novo lançamento.
meritocracyAllocationSchema.index(
    { tenantId: 1, competence: 1 },
    { unique: true, partialFilterExpression: { status: 'success' } },
)

export const MeritocracyAllocation =
    models.MeritocracyAllocation ??
    model<MeritocracyAllocationDocument>('MeritocracyAllocation', meritocracyAllocationSchema)
