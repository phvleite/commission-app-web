import { connectDB } from '@/lib/db'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
import { getEffectiveMonthlyPriceCents, getResolvedServicePlan } from '@/lib/service-plans'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'
import { hashPassword } from '@/lib/password'
import { isValidCnpj, normalizeCnpj } from '@/lib/validators/cnpj'
import { isValidCpf, normalizeCpf } from '@/lib/validators/cpf'
import { Types } from 'mongoose'

interface CompanyAddressInput {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
}

interface CompanyUpdateBody {
    name?: string
    legalName?: string
    cnpj?: string
    phoneCommercial?: string
    phoneMobile?: string
    phone?: string
    email?: string
    maxUsers?: number
    address?: CompanyAddressInput
    responsible?: {
        name?: string
        email?: string
        cpf?: string
        phone?: string
        password?: string
        passwordConfirmation?: string
    }
}

function normalizeOptionalString(value?: string): string | undefined {
    const normalized = value?.trim()
    return normalized ? normalized : undefined
}

function normalizeAddress(address?: CompanyAddressInput) {
    if (!address) {
        return undefined
    }

    const street = address.street?.trim()
    const number = address.number?.trim()
    const neighborhood = address.neighborhood?.trim()
    const city = address.city?.trim()
    const state = address.state?.trim().toUpperCase()
    const zipCode = address.zipCode?.trim()

    const hasAnyAddressField = street || number || neighborhood || city || state || zipCode

    if (!hasAnyAddressField) {
        return undefined
    }

    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
        throw new Error('Para endereco, preencha todos os campos.')
    }

    if (state.length !== 2) {
        throw new Error('O estado deve ter 2 caracteres (UF).')
    }

    return {
        street,
        number,
        neighborhood,
        city,
        state,
        zipCode,
    }
}

export async function GET() {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    await connectDB()

    const tenant = await Tenant.findById(user.tenantId).lean()

    if (!tenant) {
        return Response.json({ error: 'Empresa nao encontrada.' }, { status: 404 })
    }

    let responsible: {
        _id: string
        name: string
        email: string
        cpf?: string
        phone?: string
    } | null = null

    if (tenant.responsibleUserId) {
        const responsibleUser = await User.findOne({
            _id: tenant.responsibleUserId,
            tenantId: user.tenantId,
        })
            .select('name email cpf phone')
            .lean()

        if (responsibleUser) {
            responsible = {
                _id: responsibleUser._id.toString(),
                name: responsibleUser.name,
                email: responsibleUser.email,
                cpf: responsibleUser.cpf,
                phone: responsibleUser.phone,
            }
        }
    }

    return Response.json({
        data: {
            ...tenant,
            maxUsers: getResolvedServicePlan(tenant.planCode).maxUsers,
            effectiveMonthlyPriceCents: getEffectiveMonthlyPriceCents(
                tenant.planCode,
                tenant.monthlyPriceOverrideCents,
            ),
            responsible,
        },
    })
}

export async function PATCH(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json({ error: 'Sem permissao para editar empresa.' }, { status: 403 })
    }

    const body = (await request.json()) as CompanyUpdateBody

    const name = body.name?.trim()
    const legalName = body.legalName?.trim()
    const cnpjRaw = normalizeOptionalString(body.cnpj)
    const companyPhoneCommercial = normalizeOptionalString(body.phoneCommercial)
    const companyPhoneMobile = normalizeOptionalString(body.phoneMobile)
    const companyPhoneLegacy = normalizeOptionalString(body.phone)
    const companyEmail = normalizeOptionalString(body.email)?.toLowerCase()

    const responsibleName = normalizeOptionalString(body.responsible?.name)
    const responsibleEmail = normalizeOptionalString(body.responsible?.email)?.toLowerCase()
    const responsibleCpfRaw = normalizeOptionalString(body.responsible?.cpf)
    const responsiblePhone = normalizeOptionalString(body.responsible?.phone)
    const responsiblePassword = body.responsible?.password
    const responsiblePasswordConfirmation = body.responsible?.passwordConfirmation

    if (!name || !legalName) {
        return Response.json({ error: 'name e legalName sao obrigatorios.' }, { status: 400 })
    }

    if (!responsibleName || !responsibleEmail || !responsibleCpfRaw || !responsiblePhone) {
        return Response.json(
            { error: 'Dados do responsavel (nome, email, cpf e telefone) sao obrigatorios.' },
            { status: 400 },
        )
    }

    let cnpj: string | undefined
    if (cnpjRaw) {
        cnpj = normalizeCnpj(cnpjRaw)
        if (!isValidCnpj(cnpj)) {
            return Response.json({ error: 'Informe um CNPJ valido.' }, { status: 400 })
        }
    }

    if (companyEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(companyEmail)) {
            return Response.json({ error: 'Informe um email valido.' }, { status: 400 })
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(responsibleEmail)) {
        return Response.json(
            { error: 'Informe um email valido para o responsavel.' },
            { status: 400 },
        )
    }

    const responsibleCpf = normalizeCpf(responsibleCpfRaw)
    if (!isValidCpf(responsibleCpf)) {
        return Response.json(
            { error: 'Informe um CPF valido para o responsavel.' },
            { status: 400 },
        )
    }

    if (responsiblePassword || responsiblePasswordConfirmation) {
        if (!responsiblePassword || !responsiblePasswordConfirmation) {
            return Response.json(
                { error: 'Informe e confirme a senha do responsavel.' },
                { status: 400 },
            )
        }

        if (responsiblePassword.length < 8) {
            return Response.json(
                { error: 'A senha do responsavel precisa ter no minimo 8 caracteres.' },
                { status: 400 },
            )
        }

        if (responsiblePassword !== responsiblePasswordConfirmation) {
            return Response.json(
                { error: 'A confirmacao de senha do responsavel nao confere.' },
                { status: 400 },
            )
        }
    }

    let address: ReturnType<typeof normalizeAddress>

    try {
        address = normalizeAddress(body.address)
    } catch (error) {
        return Response.json(
            {
                error:
                    error instanceof Error ? error.message : 'Endereco invalido para atualizacao.',
            },
            { status: 400 },
        )
    }

    await connectDB()

    const DUPLICATE_CNPJ_ERROR = 'Ja existe empresa com este CNPJ.'

    const tenantBefore = await Tenant.findById(user.tenantId).select('responsibleUserId').lean()

    if (!tenantBefore) {
        return Response.json({ error: 'Empresa nao encontrada.' }, { status: 404 })
    }

    if (cnpj) {
        const existingTenantWithCnpj = await Tenant.findOne({
            cnpj,
            _id: { $ne: user.tenantId },
        })
            .select('_id')
            .lean()

        if (existingTenantWithCnpj) {
            return Response.json({ error: DUPLICATE_CNPJ_ERROR }, { status: 409 })
        }
    }

    let responsibleUserId = tenantBefore.responsibleUserId

    try {
        if (responsibleUserId && Types.ObjectId.isValid(String(responsibleUserId))) {
            const responsibleUser = await User.findOne({
                _id: responsibleUserId,
                tenantId: user.tenantId,
            })

            if (!responsibleUser) {
                responsibleUserId = undefined
            } else {
                responsibleUser.name = responsibleName
                responsibleUser.email = responsibleEmail
                responsibleUser.cpf = responsibleCpf
                responsibleUser.phone = responsiblePhone
                responsibleUser.role = 'admin'
                responsibleUser.active = true

                if (responsiblePassword) {
                    responsibleUser.passwordHash = await hashPassword(responsiblePassword)
                }

                await responsibleUser.save()
            }
        }

        if (!responsibleUserId) {
            if (!responsiblePassword) {
                return Response.json(
                    {
                        error: 'Defina a senha do responsavel para concluir o cadastro de acesso.',
                    },
                    { status: 400 },
                )
            }

            const passwordHash = await hashPassword(responsiblePassword)
            const createdResponsible = await User.create({
                tenantId: user.tenantId,
                name: responsibleName,
                email: responsibleEmail,
                cpf: responsibleCpf,
                phone: responsiblePhone,
                passwordHash,
                role: 'admin',
                active: true,
            })

            responsibleUserId = createdResponsible._id
        }
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return Response.json(
                { error: 'Ja existe usuario com este email neste tenant.' },
                { status: 409 },
            )
        }

        const message = error instanceof Error ? error.message : ''
        if (message.includes('Limite de ') && message.includes('usuarios por tenant')) {
            return Response.json({ error: message }, { status: 400 })
        }

        return Response.json(
            { error: 'Nao foi possivel atualizar o responsavel.' },
            { status: 500 },
        )
    }

    const setData: Record<string, unknown> = {
        name,
        legalName,
        responsibleUserId,
    }
    const unsetData: Record<string, 1> = {}

    if (address) {
        setData.address = address
    } else {
        unsetData.address = 1
    }

    if (cnpj) {
        setData.cnpj = cnpj
    } else {
        unsetData.cnpj = 1
    }

    const phoneCommercialToSave = companyPhoneCommercial ?? companyPhoneLegacy

    if (phoneCommercialToSave) {
        setData.phoneCommercial = phoneCommercialToSave
    } else {
        unsetData.phoneCommercial = 1
    }

    if (companyPhoneMobile) {
        setData.phoneMobile = companyPhoneMobile
    } else {
        unsetData.phoneMobile = 1
    }

    if (phoneCommercialToSave) {
        // Keep legacy field in sync for backwards compatibility while frontend migrates.
        setData.phone = phoneCommercialToSave
    } else {
        unsetData.phone = 1
    }

    if (companyEmail) {
        setData.email = companyEmail
    } else {
        unsetData.email = 1
    }

    let tenant
    try {
        tenant = await Tenant.findByIdAndUpdate(
            user.tenantId,
            {
                $set: setData,
                ...(Object.keys(unsetData).length > 0 ? { $unset: unsetData } : {}),
            },
            { returnDocument: 'after' },
        ).lean()
    } catch (error) {
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
                return Response.json({ error: DUPLICATE_CNPJ_ERROR }, { status: 409 })
            }
        }

        return Response.json({ error: 'Nao foi possivel atualizar a empresa.' }, { status: 500 })
    }

    if (!tenant) {
        return Response.json({ error: 'Empresa nao encontrada.' }, { status: 404 })
    }

    const responsibleUser = responsibleUserId
        ? await User.findOne({
              _id: responsibleUserId,
              tenantId: user.tenantId,
          })
              .select('name email cpf phone')
              .lean()
        : null

    return Response.json({
        data: {
            ...tenant,
            maxUsers: getResolvedServicePlan(tenant.planCode).maxUsers,
            effectiveMonthlyPriceCents: getEffectiveMonthlyPriceCents(
                tenant.planCode,
                tenant.monthlyPriceOverrideCents,
            ),
            responsible: responsibleUser
                ? {
                      _id: responsibleUser._id.toString(),
                      name: responsibleUser.name,
                      email: responsibleUser.email,
                      cpf: responsibleUser.cpf,
                      phone: responsibleUser.phone,
                  }
                : null,
        },
    })
}
