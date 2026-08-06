import Image from 'next/image'
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
                    <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">
                        Cadastro da empresa
                    </h1>

                    <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
                        Estruture setores, percentuais e equipe para iniciar a distribuição da
                        gorjeta com regras claras desde o primeiro dia.
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                            <p className="text-xs tracking-widest text-slate-200 uppercase">
                                Tenant
                            </p>
                            <p className="mt-2 text-sm font-medium">
                                Base isolada para os dados da sua empresa
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                            <p className="text-xs tracking-widest text-slate-200 uppercase">
                                Acesso
                            </p>
                            <p className="mt-2 text-sm font-medium">
                                Primeiro administrador para iniciar a operação
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center sm:mt-10">
                        <Image
                            src="/logo-commission-star-white-balls-and-name.svg"
                            alt="Commission"
                            width={17709}
                            height={14642}
                            className="h-auto w-4/5"
                            priority
                            unoptimized
                        />
                    </div>
                </div>

                <div className="bg-(--color-surface) px-6 py-8 sm:px-10 sm:py-10">
                    <h2 className="gold-bar-title text-2xl font-semibold text-(--color-primary-strong)">
                        Crie sua conta
                    </h2>

                    <SignupForm />
                </div>
            </section>
        </main>
    )
}
