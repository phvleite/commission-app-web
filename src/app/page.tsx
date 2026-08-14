import Image from 'next/image'

export default function Home() {
    return (
        <main className="app-shell flex flex-1 items-start justify-center px-4 pt-3 pb-6 sm:px-6 sm:pt-4 sm:pb-8 lg:px-6 lg:pt-6 lg:pb-12">
            <section className="panel w-full max-w-6xl overflow-hidden">
                <div className="grid lg:min-h-170 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="flex flex-col justify-start bg-[linear-gradient(160deg,var(--color-primary-strong),var(--color-primary))] px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                        <div className="space-y-4">
                            <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                                Distribuição de gorjetas com regra clara, setor por setor.
                            </h1>
                            <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8 lg:text-lg">
                                O Commission organiza os 10% entre todos os colaboradores, com base
                                nos percentuais dos setores e nas situações de cada dia.
                            </p>

                            <div className="flex justify-center pt-2 sm:pt-3">
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

                        <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                            <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
                                <div className="text-sm font-semibold tracking-wide text-(--color-accent)">
                                    01
                                </div>
                                <p className="mt-1 text-sm text-slate-200/90">
                                    Defina setores e percentuais da empresa
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
                                <div className="text-sm font-semibold tracking-wide text-(--color-accent)">
                                    02
                                </div>
                                <p className="mt-1 text-sm text-slate-200/90">
                                    Cadastre colaboradores por setor
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm sm:p-5 sm:col-span-2 lg:col-span-1">
                                <div className="text-sm font-semibold tracking-wide text-(--color-accent)">
                                    03
                                </div>
                                <p className="mt-1 text-sm text-slate-200/90">
                                    Lance vendas e situações para calcular o rateio
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center sm:mt-8">
                            <a
                                className="gold-button inline-flex w-full max-w-xl items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-(--color-primary-strong) shadow-[0_14px_30px_rgba(212,175,55,0.22)] transition hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) sm:text-base"
                                href="/saiba-mais"
                            >
                                Saiba mais sobre cada módulo
                            </a>
                        </div>

                        <p className="mt-4 text-center text-sm text-slate-200 sm:text-base">
                            Contato:{' '}
                            <a
                                href="mailto:contato@commission.com.br"
                                className="font-semibold text-(--color-accent) underline underline-offset-3"
                            >
                                contato@commission.com.br
                            </a>
                        </p>
                    </div>

                    <div className="flex flex-col justify-center gap-6 bg-(--color-surface) px-5 py-8 sm:px-8 sm:py-10 lg:gap-8 lg:px-12 lg:py-12">
                        <div>
                            <p className="gold-bar-title text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase sm:text-sm sm:tracking-[0.2em]">
                                Plataforma de gestão de gorjetas
                            </p>
                            <h2 className="mt-4 text-2xl font-semibold text-(--color-primary-strong) sm:text-3xl">
                                Controle a distribuição com transparência para toda a equipe.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-(--color-muted) sm:text-base sm:leading-8">
                                Configure regras uma vez e acompanhe o histórico diário de forma
                                simples, com critério para participação no rateio.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:gap-5">
                            <div className="rounded-2xl border border-(--color-border) bg-surface-soft/50 p-4 sm:p-5">
                                <h3 className="text-base font-semibold text-(--color-primary-strong) sm:text-lg">
                                    Como o Commission funciona
                                </h3>
                                <ul className="mt-4 space-y-2.5 text-sm leading-7 text-(--color-muted) sm:space-y-3">
                                    <li>Setores com percentuais definidos pela empresa.</li>
                                    <li>Colaboradores vinculados aos seus setores.</li>
                                    <li>
                                        Situações (falta, férias, atestado e outras) determinam
                                        participação no dia.
                                    </li>
                                    <li>Rateio calculado com base nas vendas registradas.</li>
                                </ul>
                            </div>

                            <div className="panel border-(--color-border) p-4 sm:p-5">
                                <h3 className="text-base font-semibold text-(--color-primary-strong) sm:text-lg">
                                    Benefícios para a operação
                                </h3>
                                <ul className="mt-4 space-y-2.5 text-sm leading-7 text-(--color-muted) sm:space-y-3">
                                    <li>Menos discussão manual sobre os 10%.</li>
                                    <li>Regras padronizadas e auditáveis.</li>
                                    <li>Visão clara por período e por colaborador.</li>
                                    <li>Processo mais justo para toda a equipe.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <a
                                className="primary-button inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:text-base"
                                href="/login"
                            >
                                Entrar no sistema
                            </a>
                            <a
                                className="secondary-button inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:text-base"
                                href="/planos"
                            >
                                Cadastrar empresa
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
