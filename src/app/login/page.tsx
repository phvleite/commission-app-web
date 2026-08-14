import Image from 'next/image'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
    const session = await auth()

    if (session?.user) {
        redirect('/dashboard')
    }

    return (
        <main className="app-shell flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
            <section className="panel grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
                <div className="bg-[linear-gradient(155deg,var(--color-primary-strong),var(--color-primary))] px-6 py-8 text-white sm:px-10 sm:py-10">
                    <div className="mx-auto flex w-3/5 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-sm sm:px-4">
                        <Image
                            src="/logo-commission-star-white-balls-and-name.svg"
                            alt="Commission"
                            width={17709}
                            height={14642}
                            className="h-auto w-full"
                            priority
                            unoptimized
                        />
                    </div>

                    <h1 className="mt-6 text-3xl leading-tight font-semibold sm:text-4xl">
                        Acesse sua operação de gorjetas
                    </h1>

                    <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
                        Entre para acompanhar vendas, situações e rateio com os critérios da sua
                        empresa.
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                            <p className="text-xs tracking-widest text-slate-200 uppercase">
                                Setores
                            </p>
                            <p className="mt-2 text-sm font-medium">
                                Percentuais configurados para cada area
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                            <p className="text-xs tracking-widest text-slate-200 uppercase">
                                Situações
                            </p>
                            <p className="mt-2 text-sm font-medium">
                                Presença válida para quem participa do rateio
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-(--color-surface) px-6 py-8 sm:px-10 sm:py-10">
                    <h2 className="gold-bar-title text-2xl font-semibold text-(--color-primary-strong)">
                        Acesse sua conta
                    </h2>
                    <p className="mt-3 mb-6 text-sm leading-7 text-(--color-muted)">
                        Use o e-mail e a senha do administrador ou usuário autorizado.
                    </p>

                    <p className="mb-6 text-sm leading-7 text-(--color-muted)">
                        Não possui cadastro?{' '}
                        <a className="font-semibold text-(--color-primary)" href="/planos">
                            Cadastre sua empresa
                        </a>
                    </p>

                    <LoginForm />
                </div>
            </section>
        </main>
    )
}
