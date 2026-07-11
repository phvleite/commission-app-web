export default function Home() {
    return (
        <main className="app-shell flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-16">
            <section className="panel w-full max-w-6xl overflow-hidden">
                <div className="grid lg:min-h-190 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="flex flex-col justify-between bg-[linear-gradient(160deg,var(--color-primary-strong),var(--color-primary))] px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                        <div className="space-y-5 sm:space-y-6">
                            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-medium tracking-[0.16em] text-white/85 uppercase sm:text-sm sm:tracking-[0.18em]">
                                Commission App Web
                            </div>
                            <div className="space-y-4">
                                <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                                    Gestão de comissões com a mesma identidade visual da versão
                                    desktop.
                                </h1>
                                <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8 lg:text-lg">
                                    Multi-tenant, histórico por venda, rateio por setor e base
                                    pronta para autenticação, APIs e relatórios em PDF.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 pt-8 sm:grid-cols-2 sm:gap-4 sm:pt-10 lg:grid-cols-3">
                            <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
                                <div className="text-2xl font-semibold text-(--color-accent)">
                                    9
                                </div>
                                <p className="mt-1 text-sm text-slate-200/90">
                                    models mapeados do desktop
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
                                <div className="text-2xl font-semibold text-(--color-accent)">
                                    47
                                </div>
                                <p className="mt-1 text-sm text-slate-200/90">
                                    testes da base já prontos
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm sm:p-5 sm:col-span-2 lg:col-span-1">
                                <div className="text-2xl font-semibold text-(--color-accent)">
                                    100%
                                </div>
                                <p className="mt-1 text-sm text-slate-200/90">
                                    paleta herdada do desktop
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center gap-6 bg-(--color-surface) px-5 py-8 sm:px-8 sm:py-10 lg:gap-8 lg:px-12 lg:py-12">
                        <div>
                            <p className="gold-bar-title text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase sm:text-sm sm:tracking-[0.2em]">
                                Base da implantação web
                            </p>
                            <h2 className="mt-4 text-2xl font-semibold text-(--color-primary-strong) sm:text-3xl">
                                Próximo passo natural: tela de login.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-(--color-muted) sm:text-base sm:leading-8">
                                A autenticação por credenciais multi-tenant já está configurada com
                                tenantSlug + email + password. O que falta agora é conectar essa
                                base à interface.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:gap-5">
                            <div className="rounded-2xl border border-(--color-border) bg-surface-soft/50 p-4 sm:p-5">
                                <h3 className="text-base font-semibold text-(--color-primary-strong) sm:text-lg">
                                    Cores oficiais
                                </h3>
                                <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-(--color-muted) shadow-sm sm:text-sm">
                                        <span className="h-4 w-4 rounded-full bg-(--color-primary-strong)" />
                                        #0A1A2F
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-(--color-muted) shadow-sm sm:text-sm">
                                        <span className="h-4 w-4 rounded-full bg-(--color-primary)" />
                                        #12395B
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-(--color-muted) shadow-sm sm:text-sm">
                                        <span className="h-4 w-4 rounded-full bg-(--color-primary-soft)" />
                                        #4FA3D1
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-(--color-muted) shadow-sm sm:text-sm">
                                        <span className="h-4 w-4 rounded-full bg-(--color-accent)" />
                                        #D4AF37
                                    </div>
                                </div>
                            </div>

                            <div className="panel border-(--color-border) p-4 sm:p-5">
                                <h3 className="text-base font-semibold text-(--color-primary-strong) sm:text-lg">
                                    Stack da fundação
                                </h3>
                                <ul className="mt-4 space-y-2.5 text-sm leading-7 text-(--color-muted) sm:space-y-3">
                                    <li>Next.js 16 + TypeScript 5</li>
                                    <li>MongoDB Atlas + Mongoose</li>
                                    <li>Auth.js v5 com credenciais multi-tenant</li>
                                    <li>Jest + Playwright + MongoDB in-memory</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <a
                                className="primary-button inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:text-base"
                                href="/login"
                            >
                                Ir para login
                            </a>
                            <div className="inline-flex items-center rounded-xl border border-(--color-border) px-5 py-3 text-sm text-(--color-muted)">
                                Próxima entrega: UI de autenticação e dashboard.
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
