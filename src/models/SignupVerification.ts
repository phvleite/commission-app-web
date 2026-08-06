import { Schema, model, models, Types, Document } from 'mongoose'

export interface ISignupVerificationAddress {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
}

export interface ISignupVerification extends Document {
    _id: Types.ObjectId
    tenantSlug: string
    companyName: string
    legalName: string
    companyCnpj: string
    companyEmail: string
    companyPhoneCommercial?: string
    companyPhoneMobile?: string
    address?: ISignupVerificationAddress
    adminName: string
    adminEmail: string
    adminCpf: string
    adminPhoneMobile: string
    passwordHash: string
    verificationCodeHash: string
    verificationExpiresAt: Date
    attempts: number
    verifiedAt?: Date
}

const addressSchema = new Schema<ISignupVerificationAddress>(
    {
        street: { type: String, trim: true },
        number: { type: String, trim: true },
        neighborhood: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true, uppercase: true, maxlength: 2 },
        zipCode: { type: String, trim: true },
    },
    { _id: false },
)

const signupVerificationSchema = new Schema<ISignupVerification>(
    {
        tenantSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
        companyName: { type: String, required: true, trim: true },
        legalName: { type: String, required: true, trim: true },
        companyCnpj: { type: String, required: true, trim: true },
        companyEmail: { type: String, required: true, trim: true, lowercase: true },
        companyPhoneCommercial: { type: String, trim: true },
        companyPhoneMobile: { type: String, trim: true },
        address: { type: addressSchema },
        adminName: { type: String, required: true, trim: true },
        adminEmail: { type: String, required: true, trim: true, lowercase: true },
        adminCpf: { type: String, required: true, trim: true },
        adminPhoneMobile: { type: String, required: true, trim: true },
        passwordHash: { type: String, required: true },
        verificationCodeHash: { type: String, required: true },
        verificationExpiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        verifiedAt: { type: Date },
    },
    { timestamps: true },
)

signupVerificationSchema.index({ verificationExpiresAt: 1 }, { expireAfterSeconds: 0 })

export const SignupVerification =
    models.SignupVerification ??
    model<ISignupVerification>('SignupVerification', signupVerificationSchema)
