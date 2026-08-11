import { auth } from '@/auth'
import {
    getEffectiveMonthlyPriceCents,
    getResolvedServicePlan,
    isServicePlanCode,
} from '@/lib/service-plans'
import { connectDB } from '@/lib/db'
import {
    Tenant,
    TENANT_BILLING_STATUS,
    type ITenantDiscount,
    type TenantBillingStatus,
} from '@/models/Tenant'
import type { PlatformRole } from '@/models/User'

function canManagePlatformTenants(platformRole?: PlatformRole): boolean {
    return platformRole === 'platform_owner' || platformRole === 'platform_admin'
}

function isTenantBillingStatus(value?: string | null): value is TenantBillingStatus {
    return TENANT_BILLING_STATUS.includes(value as TenantBillingStatus)
}

function normalizeDiscounts(value: unknown): ITenantDiscount[] {
    if (!Array.isArray(value)) {
        throw new Error('discounts deve ser um array.')
    }

    return value.map((discount, index) => {
        if (typeof discount !== 'object' || discount === null) {
            throw new Error(`discounts[${index}] invalido.`)
        }

        const candidate = discount as {
            code?: unknown
            percentage?: unknown
            isAbrasel?: unknown
        }

        const code = typeof candidate.code === 'string' ? candidate.code.trim().toLowerCase() : ''
        const percentage =
            typeof candidate.percentage === 'number'
                ? candidate.percentage
                : typeof candidate.percentage === 'string' && candidate.percentage.trim() !== ''
                  ? Number(candidate.percentage)
                  : Number.NaN

        if (!code) {
            throw new Error(`discounts[${index}].code e obrigatorio.`)
        }

        if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
            throw new Error(`discounts[${index}].percentage deve estar entre 0 e 100.`)
        }

        const normalized: ITenantDiscount = {
            code,
            percentage,
        }

        if (typeof candidate.isAbrasel === 'boolean') {
            normalized.isAbrasel = candidate.isAbrasel
        }

        return normalized
    })
}

function serializeTenant(tenant: {
    _id: { toString(): string }
    name: string
    slug: string
    planCode?: string
    billingStatus: TenantBillingStatus
    nextBillingAt?: Date | null
    monthlyPriceOverrideCents?: number | null
    maxUsers?: number
    active: boolean
    discounts?: ITenantDiscount[]
}) {
    const resolvedPlan = getResolvedServicePlan(tenant.planCode)

    return {
        _id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        planCode: resolvedPlan.code,
        billingStatus: tenant.billingStatus,
        nextBillingAt:
            tenant.nextBillingAt instanceof Date ? tenant.nextBillingAt.toISOString() : undefined,
        monthlyPriceOverrideCents: tenant.monthlyPriceOverrideCents ?? undefined,
        effectiveMonthlyPriceCents: getEffectiveMonthlyPriceCents(
            resolvedPlan.code,
            tenant.monthlyPriceOverrideCents,
        ),
        maxUsers: resolvedPlan.maxUsers,
        active: tenant.active,
        discounts: tenant.discounts ?? [],
    }
}

export async function GET() {
    const session = await auth()

    if (!session?.user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!session.user.platformRole) {
        return Response.json({ error: 'Sem permissao para acessar.' }, { status: 403 })
    }

    await connectDB()

    const tenants = await Tenant.find({}).sort({ name: 1 }).lean()

    return Response.json({
        data: tenants.map((tenant) => serializeTenant(tenant)),
    })
}

export async function PUT(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canManagePlatformTenants(session.user.platformRole)) {
        return Response.json({ error: 'Sem permissao para editar tenant.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        id?: string
        planCode?: string
        billingStatus?: string
        nextBillingAt?: string | null
        monthlyPriceOverrideCents?: number | null
        discounts?: unknown
    }

    const id = body.id?.trim()
    const planCode = body.planCode?.trim()
    const billingStatus = body.billingStatus?.trim()

    if (!id || !planCode || !billingStatus) {
        return Response.json(
            { error: 'id, planCode e billingStatus sao obrigatorios.' },
            { status: 400 },
        )
    }

    if (!/^([a-f\d]{24})$/i.test(id)) {
        return Response.json({ error: 'ID invalido.' }, { status: 400 })
    }

    if (!isServicePlanCode(planCode)) {
        return Response.json({ error: 'planCode invalido.' }, { status: 400 })
    }

    if (!isTenantBillingStatus(billingStatus)) {
        return Response.json({ error: 'billingStatus invalido.' }, { status: 400 })
    }

    let monthlyPriceOverrideCents: number | null | undefined
    if (body.monthlyPriceOverrideCents === null) {
        monthlyPriceOverrideCents = null
    } else if (typeof body.monthlyPriceOverrideCents === 'number') {
        if (
            !Number.isInteger(body.monthlyPriceOverrideCents) ||
            body.monthlyPriceOverrideCents < 0
        ) {
            return Response.json(
                { error: 'monthlyPriceOverrideCents deve ser inteiro maior ou igual a zero.' },
                { status: 400 },
            )
        }

        monthlyPriceOverrideCents = body.monthlyPriceOverrideCents
    } else if (typeof body.monthlyPriceOverrideCents !== 'undefined') {
        return Response.json({ error: 'monthlyPriceOverrideCents invalido.' }, { status: 400 })
    }

    let nextBillingAt: Date | null | undefined
    if (body.nextBillingAt === null) {
        nextBillingAt = null
    } else if (typeof body.nextBillingAt === 'string') {
        const parsed = new Date(body.nextBillingAt)
        if (Number.isNaN(parsed.getTime())) {
            return Response.json({ error: 'nextBillingAt invalido.' }, { status: 400 })
        }
        nextBillingAt = parsed
    } else if (typeof body.nextBillingAt !== 'undefined') {
        return Response.json({ error: 'nextBillingAt invalido.' }, { status: 400 })
    }

    let discounts: ITenantDiscount[]
    try {
        discounts = normalizeDiscounts(body.discounts ?? [])
    } catch (error) {
        return Response.json(
            { error: error instanceof Error ? error.message : 'discounts invalido.' },
            { status: 400 },
        )
    }

    await connectDB()

    const updated = await Tenant.findByIdAndUpdate(
        id,
        {
            $set: {
                planCode,
                billingStatus,
                discounts,
                ...(typeof monthlyPriceOverrideCents === 'number'
                    ? { monthlyPriceOverrideCents }
                    : {}),
                ...(nextBillingAt instanceof Date ? { nextBillingAt } : {}),
            },
            ...(monthlyPriceOverrideCents === null
                ? { $unset: { monthlyPriceOverrideCents: 1 } }
                : {}),
            ...(nextBillingAt === null ? { $unset: { nextBillingAt: 1 } } : {}),
        },
        { returnDocument: 'after' },
    ).lean()

    if (!updated) {
        return Response.json({ error: 'Tenant nao encontrado.' }, { status: 404 })
    }

    return Response.json({
        data: serializeTenant(updated),
    })
}
