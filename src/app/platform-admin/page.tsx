import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { getEffectiveMonthlyPriceCents, getResolvedServicePlan } from '@/lib/service-plans'
import { auth, signOut } from '@/auth'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'
import { PlatformTenantsClient, type PlatformTenant } from './PlatformTenantsClient'
import { PlatformUsersClient, type PlatformUser } from './PlatformUsersClient'

export default async function PlatformAdminPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (!session.user.platformRole) {
        redirect('/dashboard')
    }

    await connectDB()

    const platformUsers = await User.find({
        platformRole: { $exists: true, $ne: null },
    })
        .sort({ name: 1 })
        .select('-passwordHash')
        .lean()

    const tenants = await Tenant.find({}).sort({ name: 1 }).lean()

    const initialUsers: PlatformUser[] = platformUsers
        .filter((user) => Boolean(user.platformRole))
        .map((user) => ({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            platformRole: user.platformRole,
            active: user.active,
            createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : undefined,
        }))

    const initialTenants: PlatformTenant[] = tenants.map((tenant) => {
        const resolvedPlan = getResolvedServicePlan(tenant.planCode)

        return {
            _id: tenant._id.toString(),
            name: tenant.name,
            slug: tenant.slug,
            planCode: resolvedPlan.code,
            billingStatus: tenant.billingStatus,
            nextBillingAt:
                tenant.nextBillingAt instanceof Date
                    ? tenant.nextBillingAt.toISOString()
                    : undefined,
            monthlyPriceOverrideCents: tenant.monthlyPriceOverrideCents,
            effectiveMonthlyPriceCents: getEffectiveMonthlyPriceCents(
                resolvedPlan.code,
                tenant.monthlyPriceOverrideCents,
            ),
            maxUsers: resolvedPlan.maxUsers,
            active: tenant.active,
            discounts: tenant.discounts ?? [],
        }
    })

    return (
        <section className="panel mx-auto w-full max-w-5xl p-6 sm:p-8">
            <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                Area de plataforma
            </p>
            <h1 className="gold-bar-title mt-3 text-3xl font-semibold text-(--color-primary-strong)">
                Platform Admin
            </h1>
            <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                Usuario: {session.user.name} • Role da plataforma: {session.user.platformRole}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-(--color-border) bg-white/70 p-4">
                    <p className="text-sm font-semibold text-(--color-primary-strong)">
                        Gestao de tenants
                    </p>
                    <p className="mt-2 text-xs text-(--color-muted)">
                        Criar, ativar/inativar e administrar empresas da plataforma.
                    </p>
                </div>

                <div className="rounded-2xl border border-(--color-border) bg-white/70 p-4">
                    <p className="text-sm font-semibold text-(--color-primary-strong)">
                        Usuarios internos
                    </p>
                    <p className="mt-2 text-xs text-(--color-muted)">
                        Administrar platform_owner, platform_admin e platform_auditor.
                    </p>
                </div>

                <div className="rounded-2xl border border-(--color-border) bg-white/70 p-4">
                    <p className="text-sm font-semibold text-(--color-primary-strong)">Auditoria</p>
                    <p className="mt-2 text-xs text-(--color-muted)">
                        Trilha de acoes de login, alteracoes e operacoes criticas.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <PlatformTenantsClient initialTenants={initialTenants} />
            </div>

            <div className="mt-8">
                <PlatformUsersClient initialUsers={initialUsers} />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
                <a
                    href="/dashboard"
                    className="secondary-button rounded-xl border border-(--color-border) px-4 py-2 text-sm font-semibold"
                >
                    Ir para dashboard tenant
                </a>

                <form
                    action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/login' })
                    }}
                >
                    <button
                        className="cancel-button rounded-xl px-4 py-2 text-sm font-semibold"
                        type="submit"
                    >
                        Sair
                    </button>
                </form>
            </div>
        </section>
    )
}
