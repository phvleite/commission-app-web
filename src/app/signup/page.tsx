import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SignupForm } from './SignupForm'

export default async function SignupPage() {
    const session = await auth()

    if (session?.user) {
        redirect('/dashboard')
    }

    return (
        <main className="app-shell flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
            <section className="panel grid w-full max-w-6xl overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
                <div className="bg-[linear-gradient(155deg,var(--color-primary-strong),var(--color-primary))] px-6 py-8 text-white sm:px-10 sm:py-10">
                    <p className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs tracking-[0.14em] uppercase sm:text-sm">
                        Commission App Web
                    </p>

                    <h1 className="mt-6 text-3xl leading-tight font-semibold sm:text-4xl">
                        Cadastro da empresa
                    </h1>

                    <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
                        Crie seu tenant e o primeiro usuario administrador para iniciar o uso da
                        plataforma.
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                            <p className="text-xs tracking-[0.1em] text-slate-200 uppercase">
                                Tenant
                            </p>
                            <p className="mt-2 text-sm font-medium">Identidade unica da empresa</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                            <p className="text-xs tracking-[0.1em] text-slate-200 uppercase">
                                Acesso
                            </p>
                            <p className="mt-2 text-sm font-medium">
                                Primeiro usuario com perfil admin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-surface)] px-6 py-8 sm:px-10 sm:py-10">
                    <h2 className="gold-bar-title text-2xl font-semibold text-[var(--color-primary-strong)]">
                        Crie sua conta
                    </h2>
                    <p className="mt-3 mb-6 text-sm leading-7 text-[var(--color-muted)]">
                        Ja possui cadastro?{' '}
                        <a className="font-semibold text-[var(--color-primary)]" href="/login">
                            Fazer login
                        </a>
                    </p>

                    <SignupForm />
                </div>
            </section>
        </main>
    )
}
