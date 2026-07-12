import { connectDB } from '@/lib/db'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
import { Tenant } from '@/models/Tenant'

interface CompanyAddressInput {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
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

    return Response.json({ data: tenant })
}

export async function PATCH(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json({ error: 'Sem permissao para editar empresa.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        name?: string
        legalName?: string
        address?: CompanyAddressInput
    }

    const name = body.name?.trim()
    const legalName = body.legalName?.trim()

    if (!name || !legalName) {
        return Response.json({ error: 'name e legalName sao obrigatorios.' }, { status: 400 })
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

    const tenant = await Tenant.findByIdAndUpdate(
        user.tenantId,
        {
            $set: {
                name,
                legalName,
                address,
            },
        },
        { returnDocument: 'after' },
    ).lean()

    if (!tenant) {
        return Response.json({ error: 'Empresa nao encontrada.' }, { status: 404 })
    }

    return Response.json({ data: tenant })
}
