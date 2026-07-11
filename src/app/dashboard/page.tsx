import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <main className="app-shell flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
            <section className="panel w-full max-w-3xl p-6 sm:p-8">
                <p className="text-xs tracking-[0.14em] text-[var(--color-primary)] uppercase">
                    Area autenticada
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-[var(--color-primary-strong)]">
                    Bem-vindo, {session.user.name}
                </h1>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    Tenant: {session.user.tenantId} | Perfil: {session.user.role}
                </p>

                <div className="mt-8">
                    <form
                        action={async () => {
                            'use server'
                            await signOut({ redirectTo: '/login' })
                        }}
                    >
                        <button
                            className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                            type="submit"
                        >
                            Sair
                        </button>
                    </form>
                </div>
            </section>
        </main>
    )
}
