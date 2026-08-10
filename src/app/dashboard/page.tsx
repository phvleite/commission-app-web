import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import NoticiasCarousel from './NoticiasCarrousel'

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
            <section className="panel overflow-hidden">
                <header className="flex flex-col gap-4 border-b border-(--color-border) bg-surface-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-(--color-primary) uppercase">
                            Visão geral
                        </p>
                        <h1 className="gold-bar-title mt-2 text-2xl font-semibold text-(--color-primary-strong)">
                            Bem-vindo, {session.user.name}
                        </h1>
                        <p className="mt-2 text-sm text-(--color-muted)">
                            {session.user.tenantName} • {session.user.role}
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                        <a
                            className="primary-button rounded-xl px-4 py-2.5 text-sm font-semibold"
                            href="/dashboard/company-users"
                        >
                            Empresa e usuários
                        </a>

                        <form
                            action={async () => {
                                'use server'
                                await signOut({ redirectTo: '/login' })
                            }}
                        >
                            <button
                                className="cancel-button rounded-xl px-4 py-2.5 text-sm font-semibold"
                                type="submit"
                            >
                                Sair
                            </button>
                        </form>
                    </div>
                </header>

                <NoticiasCarousel />
            </section>
        </div>
    )
}
