import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <section className="panel mx-auto w-full max-w-3xl p-6 sm:p-8">
            <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                Area autenticada
            </p>
            <h1 className="gold-bar-title mt-3 text-3xl font-semibold text-(--color-primary-strong)">
                Bem-vindo, {session.user.name}
            </h1>
            <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                Empresa: {session.user.tenantName} • Perfil: {session.user.role}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
                <a
                    className="rounded-xl border border-(--color-border) bg-white px-5 py-3 text-sm font-semibold text-(--color-primary-strong) transition hover:bg-slate-100"
                    href="/dashboard/company-users"
                >
                    Empresa e usuarios
                </a>

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
    )
}
