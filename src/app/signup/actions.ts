'use server'

import { connectDB } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'

export interface SignupFormState {
    error?: string
    success?: string
    loginUrl?: string
}

const INITIAL_STATE: SignupFormState = {}

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

export async function registerTenantAndAdmin(
    _prevState: SignupFormState = INITIAL_STATE,
    formData: FormData,
): Promise<SignupFormState> {
    void _prevState

    const companyName = formData.get('companyName')?.toString().trim()
    const legalName = formData.get('legalName')?.toString().trim()

    const adminName = formData.get('adminName')?.toString().trim()
    const adminEmail = formData.get('adminEmail')?.toString().trim().toLowerCase()
    const password = formData.get('password')?.toString()
    const passwordConfirm = formData.get('passwordConfirm')?.toString()

    const street = formData.get('street')?.toString().trim()
    const number = formData.get('number')?.toString().trim()
    const neighborhood = formData.get('neighborhood')?.toString().trim()
    const city = formData.get('city')?.toString().trim()
    const state = formData.get('state')?.toString().trim().toUpperCase()
    const zipCode = formData.get('zipCode')?.toString().trim()

    if (!companyName || !legalName || !adminName || !adminEmail || !password || !passwordConfirm) {
        return { error: 'Preencha todos os campos obrigatorios.' }
    }

    if (password.length < 8) {
        return { error: 'A senha precisa ter no minimo 8 caracteres.' }
    }

    if (password !== passwordConfirm) {
        return { error: 'A confirmacao de senha nao confere.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
        return { error: 'Informe um email valido.' }
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

    const passwordHash = await hashPassword(password)

    const tenant = await Tenant.create({
        name: companyName,
        legalName,
        slug: tenantSlug,
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
    })

    try {
        await User.create({
            tenantId: tenant._id,
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: 'admin',
        })
    } catch (error) {
        await Tenant.deleteOne({ _id: tenant._id })

        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return { error: 'Ja existe um usuario com este email neste tenant.' }
        }

        return { error: 'Nao foi possivel concluir o cadastro agora.' }
    }

    return {
        success: 'Cadastro concluido com sucesso. Voce ja pode entrar com email e senha.',
        loginUrl: '/login',
    }
}
