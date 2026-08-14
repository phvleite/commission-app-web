import Link from 'next/link'
import { listServicePlans } from '@/lib/service-plans'

function formatCurrencyFromCents(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value / 100)
}

export default function PlansPage() {
    const plans = listServicePlans()

    return (
        <main className="app-shell flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
            <section className="w-full max-w-6xl">
                <div className="max-w-3xl">
                    <p className="gold-bar-title text-xs font-semibold tracking-widest text-(--color-primary) uppercase sm:text-sm">
                        Planos e valores
                    </p>
                    <h1 className="mt-4 text-3xl font-semibold text-(--color-primary-strong) sm:text-4xl">
                        Escolha o plano da sua operação
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-(--color-muted) sm:text-base">
                        Selecione pela quantidade de colaboradores. Você poderá revisar a escolha
                        antes de concluir o cadastro da empresa.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {plans.map((plan) => (
                        <article
                            key={plan.code}
                            className="flex flex-col rounded-lg border border-(--color-border) bg-(--color-surface) p-5 shadow-sm xl:min-h-96"
                        >
                            <p className="min-h-10 text-sm font-semibold text-(--color-primary-strong)">
                                {plan.name}
                            </p>
                            <div className="mt-4 flex flex-wrap items-end gap-x-1">
                                <span className="text-2xl font-semibold text-(--color-primary-strong)">
                                    {formatCurrencyFromCents(plan.monthlyPriceCents)}
                                </span>
                                <span className="pb-0.5 text-xs text-(--color-muted)">/ mês</span>
                            </div>
                            <ul className="mt-5 flex-1 space-y-3 text-sm leading-6 text-(--color-muted)">
                                <li>Até {plan.maxUsers} usuários administrativos</li>
                                <li>
                                    {plan.maxEmployees
                                        ? `Até ${plan.maxEmployees} colaboradores`
                                        : 'Sem limite de colaboradores'}
                                </li>
                                <li>Gestão de setores, situações e vendas</li>
                            </ul>
                            <Link
                                className="primary-button mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-semibold"
                                href={`/signup?plan=${plan.code}`}
                            >
                                Escolher este plano
                            </Link>
                        </article>
                    ))}
                </div>

                <div className="mt-6 text-center">
                    <Link className="text-sm font-semibold text-(--color-primary)" href="/">
                        Voltar para a página principal
                    </Link>
                </div>
            </section>
        </main>
    )
}
