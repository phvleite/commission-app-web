'use server'

import { randomInt } from 'crypto'
import { connectDB } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { sendSignupConfirmationEmail } from '@/lib/email'
import { isValidCnpj, normalizeCnpj } from '@/lib/validators/cnpj'
import { isValidCpf, normalizeCpf } from '@/lib/validators/cpf'
import { Tenant } from '@/models/Tenant'
import { SignupVerification } from '@/models/SignupVerification'
import { User } from '@/models/User'

export interface SignupFormState {
    error?: string
    success?: string
    loginUrl?: string
    verificationPending?: boolean
    signupRequestId?: string
    verificationEmail?: string
}

export interface SignupConfirmationState {
    error?: string
    success?: string
    loginUrl?: string
}

export interface SignupResendState {
    error?: string
    success?: string
    verificationEmail?: string
}

const INITIAL_STATE: SignupFormState = {}
const INITIAL_CONFIRMATION_STATE: SignupConfirmationState = {}
const INITIAL_RESEND_STATE: SignupResendState = {}
const SIGNUP_CODE_TTL_MINUTES = 15
const DUPLICATE_CNPJ_ERROR = 'Ja existe empresa com este CNPJ.'

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }

    if (typeof error === 'string') {
        return error
    }

    return 'erro-desconhecido'
}

function toExactCaseInsensitiveEmailRegex(value: string): RegExp {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`^${escaped}$`, 'i')
}

function toSlug(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

function generateVerificationCode(): string {
    return randomInt(100000, 1000000).toString()
}

function buildSignupVerificationPayload(formData: FormData) {
    const companyName = formData.get('companyName')?.toString().trim()
    const legalName = formData.get('legalName')?.toString().trim()
    const companyCnpjRaw = formData.get('companyCnpj')?.toString().trim()
    const companyEmail = formData.get('companyEmail')?.toString().trim().toLowerCase()
    const companyPhoneCommercial = formData.get('companyPhoneCommercial')?.toString().trim()
    const companyPhoneMobile = formData.get('companyPhoneMobile')?.toString().trim()

    const adminName = formData.get('adminName')?.toString().trim()
    const adminEmail = formData.get('adminEmail')?.toString().trim().toLowerCase()
    const adminCpfRaw = formData.get('adminCpf')?.toString().trim()
    const adminPhoneMobile = formData.get('adminPhoneMobile')?.toString().trim()
    const password = formData.get('password')?.toString()
    const passwordConfirm = formData.get('passwordConfirm')?.toString()

    const street = formData.get('street')?.toString().trim()
    const number = formData.get('number')?.toString().trim()
    const neighborhood = formData.get('neighborhood')?.toString().trim()
    const city = formData.get('city')?.toString().trim()
    const state = formData.get('state')?.toString().trim().toUpperCase()
    const zipCode = formData.get('zipCode')?.toString().trim()

    return {
        companyName,
        legalName,
        companyCnpjRaw,
        companyEmail,
        companyPhoneCommercial,
        companyPhoneMobile,
        adminName,
        adminEmail,
        adminCpfRaw,
        adminPhoneMobile,
        password,
        passwordConfirm,
        street,
        number,
        neighborhood,
        city,
        state,
        zipCode,
    }
}

function isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
}

export async function registerTenantAndAdmin(
    _prevState: SignupFormState = INITIAL_STATE,
    formData: FormData,
): Promise<SignupFormState> {
    void _prevState

    let signupRequestId: string | undefined

    const {
        companyName,
        legalName,
        companyCnpjRaw,
        companyEmail,
        companyPhoneCommercial,
        companyPhoneMobile,
        adminName,
        adminEmail,
        adminCpfRaw,
        adminPhoneMobile,
        password,
        passwordConfirm,
        street,
        number,
        neighborhood,
        city,
        state,
        zipCode,
    } = buildSignupVerificationPayload(formData)

    if (
        !companyName ||
        !legalName ||
        !companyCnpjRaw ||
        !companyEmail ||
        !adminName ||
        !adminEmail ||
        !adminCpfRaw ||
        !adminPhoneMobile ||
        !password ||
        !passwordConfirm
    ) {
        return { error: 'Preencha todos os campos obrigatorios.' }
    }

    if (password.length < 8) {
        return { error: 'A senha precisa ter no minimo 8 caracteres.' }
    }

    if (password !== passwordConfirm) {
        return { error: 'A confirmacao de senha nao confere.' }
    }

    if (!isValidEmail(adminEmail)) {
        return { error: 'Informe um email valido.' }
    }

    if (!isValidEmail(companyEmail)) {
        return { error: 'Informe um email valido para a empresa.' }
    }

    const companyCnpj = normalizeCnpj(companyCnpjRaw)
    if (!isValidCnpj(companyCnpj)) {
        return { error: 'Informe um CNPJ valido.' }
    }

    const adminCpf = normalizeCpf(adminCpfRaw)
    if (!isValidCpf(adminCpf)) {
        return { error: 'Informe um CPF valido para o administrador.' }
    }

    if (companyPhoneCommercial) {
        const companyPhoneDigits = companyPhoneCommercial.replace(/\D/g, '')
        if (companyPhoneDigits.length !== 10) {
            return { error: 'Informe um telefone fixo valido para a empresa.' }
        }
    }

    if (companyPhoneMobile) {
        const companyPhoneMobileDigits = companyPhoneMobile.replace(/\D/g, '')
        if (companyPhoneMobileDigits.length < 10 || companyPhoneMobileDigits.length > 11) {
            return { error: 'Informe um celular valido para a empresa.' }
        }
    }

    const adminMobileDigits = adminPhoneMobile.replace(/\D/g, '')
    if (adminMobileDigits.length < 10 || adminMobileDigits.length > 11) {
        return { error: 'Informe um celular valido para o administrador.' }
    }

    const tenantSlug = toSlug(companyName)

    if (!tenantSlug) {
        return { error: 'Nao foi possivel gerar um slug valido para o tenant.' }
    }

    const hasAddressFields = street || number || neighborhood || city || state || zipCode
    if (hasAddressFields && (!street || !number || !neighborhood || !city || !state || !zipCode)) {
        return { error: 'Para endereco, preencha todos os campos.' }
    }

    if (state && state.length !== 2) {
        return { error: 'O estado deve ter 2 caracteres (UF).' }
    }

    await connectDB()

    const existingTenant = await Tenant.findOne({ slug: tenantSlug }).lean()
    if (existingTenant) {
        return { error: 'Este slug de tenant ja esta em uso.' }
    }

    const existingTenantCnpj = await Tenant.findOne({ cnpj: companyCnpj }).select('_id').lean()
    if (existingTenantCnpj) {
        return { error: DUPLICATE_CNPJ_ERROR }
    }

    const existingUserEmail = await User.findOne({
        email: toExactCaseInsensitiveEmailRegex(adminEmail),
    })
        .select('_id')
        .lean()
    if (existingUserEmail) {
        return { error: 'Ja existe usuario com este email.' }
    }

    try {
        await SignupVerification.deleteMany({ adminEmail })

        const passwordHash = await hashPassword(password)
        const verificationCode = generateVerificationCode()
        const verificationCodeHash = await hashPassword(verificationCode)
        const signupRequest = await SignupVerification.create({
            tenantSlug,
            companyName,
            legalName,
            companyCnpj,
            companyEmail,
            companyPhoneCommercial: companyPhoneCommercial || undefined,
            companyPhoneMobile: companyPhoneMobile || undefined,
            address: hasAddressFields
                ? {
                      street,
                      number,
                      neighborhood,
                      city,
                      state,
                      zipCode,
                  }
                : undefined,
            adminName,
            adminEmail,
            adminCpf,
            adminPhoneMobile,
            passwordHash,
            verificationCodeHash,
            verificationExpiresAt: new Date(Date.now() + SIGNUP_CODE_TTL_MINUTES * 60_000),
            attempts: 0,
        })
        signupRequestId = signupRequest._id.toString()

        await sendSignupConfirmationEmail({
            to: adminEmail,
            code: verificationCode,
            adminName,
            companyName,
        })

        return {
            success: `Enviamos um codigo de confirmacao para ${adminEmail}.`,
            verificationPending: true,
            signupRequestId,
            verificationEmail: adminEmail,
        }
    } catch (error) {
        if (signupRequestId) {
            await SignupVerification.deleteOne({ _id: signupRequestId })
        }

        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return { error: 'Ja existe usuario com este email.' }
        }

        console.error('[signup] registerTenantAndAdmin failed', {
            adminEmail,
            tenantSlug,
            message: getErrorMessage(error),
        })

        return { error: 'Nao foi possivel concluir o cadastro agora.' }
    }
}

export async function confirmTenantAndAdminSignup(
    _prevState: SignupConfirmationState = INITIAL_CONFIRMATION_STATE,
    formData: FormData,
): Promise<SignupConfirmationState> {
    void _prevState

    const signupRequestId = formData.get('signupRequestId')?.toString().trim()
    const verificationCode = formData.get('verificationCode')?.toString().trim()

    if (!signupRequestId || !verificationCode) {
        return { error: 'Informe o codigo de confirmacao.' }
    }

    await connectDB()

    const signupRequest = await SignupVerification.findById(signupRequestId)

    if (!signupRequest) {
        return { error: 'Pedido de cadastro nao encontrado ou expirado.' }
    }

    if (signupRequest.verificationExpiresAt.getTime() < Date.now()) {
        await SignupVerification.deleteOne({ _id: signupRequest._id })
        return { error: 'O codigo de confirmacao expirou. Solicite um novo cadastro.' }
    }

    if (signupRequest.attempts >= 5) {
        await SignupVerification.deleteOne({ _id: signupRequest._id })
        return { error: 'Codigo bloqueado por excesso de tentativas. Solicite um novo cadastro.' }
    }

    const codeIsValid = await verifyPassword(verificationCode, signupRequest.verificationCodeHash)

    if (!codeIsValid) {
        await SignupVerification.updateOne(
            { _id: signupRequest._id },
            { $inc: { attempts: 1 }, $set: { updatedAt: new Date() } },
        )

        return { error: 'Codigo invalido. Tente novamente.' }
    }

    const existingTenant = await Tenant.findOne({ slug: signupRequest.tenantSlug }).lean()
    if (existingTenant) {
        await SignupVerification.deleteOne({ _id: signupRequest._id })
        return { error: 'Este slug de tenant ja esta em uso.' }
    }

    const existingTenantCnpj = await Tenant.findOne({ cnpj: signupRequest.companyCnpj })
        .select('_id')
        .lean()
    if (existingTenantCnpj) {
        await SignupVerification.deleteOne({ _id: signupRequest._id })
        return { error: DUPLICATE_CNPJ_ERROR }
    }

    const existingUserEmail = await User.findOne({
        email: toExactCaseInsensitiveEmailRegex(signupRequest.adminEmail),
    })
        .select('_id')
        .lean()
    if (existingUserEmail) {
        await SignupVerification.deleteOne({ _id: signupRequest._id })
        return { error: 'Ja existe usuario com este email.' }
    }

    const tenant = await Tenant.create({
        name: signupRequest.companyName,
        legalName: signupRequest.legalName,
        slug: signupRequest.tenantSlug,
        cnpj: signupRequest.companyCnpj,
        phoneCommercial: signupRequest.companyPhoneCommercial || undefined,
        phoneMobile: signupRequest.companyPhoneMobile || undefined,
        phone: signupRequest.companyPhoneCommercial || undefined,
        email: signupRequest.companyEmail,
        address: signupRequest.address,
    })

    try {
        const user = await User.create({
            tenantId: tenant._id,
            name: signupRequest.adminName,
            email: signupRequest.adminEmail,
            cpf: signupRequest.adminCpf,
            phone: signupRequest.adminPhoneMobile,
            passwordHash: signupRequest.passwordHash,
            role: 'admin',
        })

        await Tenant.updateOne(
            { _id: tenant._id },
            {
                $set: {
                    responsibleUserId: user._id,
                },
            },
        )

        await SignupVerification.deleteOne({ _id: signupRequest._id })

        return {
            success: 'Cadastro confirmado com sucesso. Voce ja pode entrar com email e senha.',
            loginUrl: '/login',
        }
    } catch (error) {
        await Tenant.deleteOne({ _id: tenant._id })

        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            if (
                'keyPattern' in error &&
                typeof (error as { keyPattern?: unknown }).keyPattern === 'object' &&
                (error as { keyPattern?: Record<string, unknown> }).keyPattern?.cnpj
            ) {
                return { error: DUPLICATE_CNPJ_ERROR }
            }

            return { error: 'Ja existe usuario com este email.' }
        }

        return { error: 'Nao foi possivel concluir o cadastro agora.' }
    }
}

export async function resendSignupConfirmationCode(
    _prevState: SignupResendState = INITIAL_RESEND_STATE,
    formData: FormData,
): Promise<SignupResendState> {
    void _prevState

    const signupRequestId = formData.get('signupRequestId')?.toString().trim()
    const rawEmail = formData.get('adminEmail')?.toString().trim().toLowerCase()

    if (!signupRequestId || !rawEmail) {
        return { error: 'Informe o e-mail para reenviar o codigo.' }
    }

    if (!isValidEmail(rawEmail)) {
        return { error: 'Informe um email valido.' }
    }

    await connectDB()

    const signupRequest = await SignupVerification.findById(signupRequestId)
    if (!signupRequest) {
        return { error: 'Pedido de cadastro nao encontrado ou expirado.' }
    }

    const existingUserEmail = await User.findOne({
        email: toExactCaseInsensitiveEmailRegex(rawEmail),
    })
        .select('_id')
        .lean()
    if (existingUserEmail) {
        return { error: 'Ja existe usuario com este email.' }
    }

    if (rawEmail !== signupRequest.adminEmail) {
        await SignupVerification.deleteMany({
            adminEmail: rawEmail,
            _id: { $ne: signupRequest._id },
        })
    }

    const previousAdminEmail = signupRequest.adminEmail
    const previousCodeHash = signupRequest.verificationCodeHash
    const previousExpiresAt = signupRequest.verificationExpiresAt
    const previousAttempts = signupRequest.attempts

    const verificationCode = generateVerificationCode()
    const verificationCodeHash = await hashPassword(verificationCode)
    const verificationExpiresAt = new Date(Date.now() + SIGNUP_CODE_TTL_MINUTES * 60_000)

    await SignupVerification.updateOne(
        { _id: signupRequest._id },
        {
            $set: {
                adminEmail: rawEmail,
                verificationCodeHash,
                verificationExpiresAt,
                attempts: 0,
                updatedAt: new Date(),
            },
        },
    )

    try {
        await sendSignupConfirmationEmail({
            to: rawEmail,
            code: verificationCode,
            adminName: signupRequest.adminName,
            companyName: signupRequest.companyName,
        })
    } catch (error) {
        await SignupVerification.updateOne(
            { _id: signupRequest._id },
            {
                $set: {
                    adminEmail: previousAdminEmail,
                    verificationCodeHash: previousCodeHash,
                    verificationExpiresAt: previousExpiresAt,
                    attempts: previousAttempts,
                    updatedAt: new Date(),
                },
            },
        )

        console.error('[signup] resendSignupConfirmationCode failed', {
            adminEmail: rawEmail,
            signupRequestId,
            message: getErrorMessage(error),
        })

        return { error: 'Nao foi possivel reenviar o codigo agora.' }
    }

    return {
        success: `Reenviamos o codigo para ${rawEmail}. Este sera o e-mail de acesso do administrador no cadastro.`,
        verificationEmail: rawEmail,
    }
}
