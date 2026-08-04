import Image from 'next/image'
import Link from 'next/link'

const modules = [
    {
        id: 'setores',
        eyebrow: 'Módulo essencial',
        title: 'Setores',
        summary:
            'Este é o ponto de partida da operação. Antes de acessar os demais módulos, a empresa precisa cadastrar seus setores e garantir que a soma dos percentuais seja exatamente 100%. Enquanto essa regra não for atendida, o restante da plataforma permanece bloqueado.',
        body: [
            'Os setores representam as áreas onde cada grupo de colaboradores atua, como Atendimento, Operacional, Serviços ou qualquer outra organização que faça sentido para o estabelecimento.',
            'O sistema também permite a criação opcional de um setor especial de Meritocracia. Ele não recebe colaboradores, mas reserva uma parte da gorjeta para metas e incentivos definidos internamente pela empresa.',
            'Ao marcar um setor como Meritocracia, o sistema protege a regra de negócio: esse setor deixa de aparecer no cadastro de colaboradores e apenas um setor desse tipo pode existir ao mesmo tempo.',
        ],
        highlights: [
            'Libera os demais módulos somente quando a soma dos percentuais fecha em 100%.',
            'Permite criar um setor especial de Meritocracia para metas e incentivos.',
            'Impede inconsistências no cadastro com validações próprias da operação.',
        ],
        gallery: [
            'Tela de cadastro de setores',
            'Configuração de percentuais',
            'Setor especial de Meritocracia',
        ],
    },
    {
        id: 'colaboradores',
        eyebrow: 'Base da equipe',
        title: 'Colaboradores',
        summary:
            'Neste módulo são cadastrados todos os colaboradores que participam da distribuição da gorjeta. O objetivo é manter uma base simples, objetiva e suficiente para que o rateio seja calculado com segurança.',
        body: [
            'Cada colaborador é vinculado a um setor, e esse vínculo é decisivo para definir de qual percentual da gorjeta ele participará.',
            'Além do nome, o sistema registra a data de admissão e, quando necessário, a data de demissão, impedindo que quem já não faz mais parte da equipe continue entrando no cálculo.',
        ],
        highlights: [
            'Vincula cada pessoa ao setor correto da operação.',
            'Mantém o histórico coerente com datas de admissão e desligamento.',
            'Prepara a base humana do rateio sem burocracia desnecessária.',
        ],
        gallery: ['Lista de colaboradores', 'Cadastro individual', 'Filtros por setor e status'],
    },
    {
        id: 'situacoes',
        eyebrow: 'Precisão no rateio',
        title: 'Situações',
        summary:
            'Este módulo garante que a distribuição da gorjeta reflita a realidade da operação. É nele que são registradas ocorrências como faltas, férias, atestados, suspensões e folgas, que alteram a participação do colaborador no período.',
        body: [
            'Se um setor possui 10 colaboradores, mas 1 deles faltou em determinado dia, a gorjeta precisa ser dividida entre 9, e não entre 10. É esse controle que torna o rateio mais justo.',
            'O módulo trabalha em duas camadas: primeiro, o cadastro dos tipos de situação; depois, o lançamento dos períodos de ocorrência. Sem ao menos um tipo cadastrado, o sistema bloqueia novos lançamentos.',
            'Além do controle operacional, a área oferece filtros avançados e geração de relatório em PDF para auditoria, consulta e impressão.',
        ],
        highlights: [
            'Exclui automaticamente do cálculo quem não participou do período informado.',
            'Aceita situações de um único dia ou intervalos mais longos.',
            'Gera relatórios em PDF com apoio de filtros de consulta.',
        ],
        gallery: [
            'Cadastro de tipos de situação',
            'Lançamento por período',
            'Relatório PDF de situações',
        ],
    },
    {
        id: 'vendas',
        eyebrow: 'Origem do cálculo',
        title: 'Vendas',
        summary:
            'Aqui a empresa registra o valor das vendas que efetivamente geraram gorjeta e a data em que ocorreram. Nem toda venda entra no cálculo, e o sistema respeita isso.',
        body: [
            'Casos como consumo da diretoria, cortesias ou recusas de pagamento podem ficar fora do rateio, preservando a fidelidade dos números.',
            'A partir do valor informado, o sistema calcula os 10%, distribui o montante entre os setores conforme os percentuais cadastrados e então realiza o rateio entre os colaboradores elegíveis.',
            'Em resumo, ao lançar valor e data, a plataforma processa automaticamente a gorjeta e salva os resultados para consulta futura.',
        ],
        highlights: [
            'Calcula automaticamente os 10% sobre a venda informada.',
            'Distribui os valores por setor e por colaborador.',
            'Grava o histórico do cálculo para consultas e relatórios posteriores.',
        ],
        gallery: ['Cadastro da venda', 'Histórico diário', 'Detalhamento por setores'],
    },
    {
        id: 'gorjetas',
        eyebrow: 'Consulta e transparência',
        title: 'Gorjetas',
        summary:
            'Este módulo é voltado para consulta e emissão de relatórios. Ele transforma os dados operacionais em informação clara para conferência, acompanhamento e prestação de contas.',
        body: [
            'É possível consultar os resultados da equipe como um todo ou visualizar os valores de um colaborador específico.',
            'O relatório geral também apresenta as situações ocorridas no período, oferecendo contexto para entender como cada valor foi composto.',
        ],
        highlights: [
            'Consulta geral e individual por colaborador.',
            'Mais transparência na conferência dos valores apurados.',
            'Relatórios úteis para gestão, auditoria e esclarecimentos internos.',
        ],
        gallery: ['Consulta geral do período', 'Consulta individual', 'Relatório consolidado'],
    },
    {
        id: 'empresa-usuarios',
        eyebrow: 'Gestão de acesso',
        title: 'Empresa e Usuários',
        summary:
            'Este módulo centraliza a atualização dos dados da empresa e o gerenciamento dos acessos ao sistema. Ele mantém a operação organizada e garante que apenas as pessoas certas utilizem a plataforma.',
        body: [
            'Aqui é possível atualizar informações cadastrais da empresa e também cadastrar, editar, inativar e administrar os usuários autorizados.',
            'Com isso, o ambiente permanece controlado, atual e adequado à rotina do estabelecimento.',
        ],
        highlights: [
            'Atualiza dados da empresa em um único lugar.',
            'Permite criar, editar e inativar usuários autorizados.',
            'Mantém o acesso da plataforma sob controle administrativo.',
        ],
        gallery: ['Cadastro da empresa', 'Gestão de usuários', 'Ajustes de acesso'],
    },
] as const

export default function SaibaMaisPage() {
    return (
        <main id="topo" className="app-shell px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-12">
            <section className="mx-auto w-full max-w-6xl space-y-8">
                <section className="panel overflow-hidden">
                    <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="bg-[linear-gradient(160deg,var(--color-primary-strong),var(--color-primary))] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                            <p className="text-xs font-semibold tracking-[0.18em] text-white/75 uppercase">
                                Saiba mais sobre o Commission
                            </p>
                            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                                Uma plataforma feita para organizar a distribuição da gorjeta com
                                critério, transparência e controle.
                            </h1>
                            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
                                O Commission estrutura os setores da empresa, conecta os
                                colaboradores às suas áreas, considera ausências e ocorrências da
                                rotina e transforma cada venda em um rateio confiável.
                            </p>

                            <div className="mt-8 flex justify-center">
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

                        <div className="bg-(--color-surface) px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                            <p className="gold-bar-title text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase">
                                Visão geral dos módulos
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {modules.map((module, index) => (
                                    <a
                                        key={module.id}
                                        href={`#${module.id}`}
                                        className="rounded-full border border-(--color-border) bg-white px-3 py-2 text-xs font-semibold text-(--color-primary-strong) shadow-sm transition hover:border-(--color-primary-soft) hover:text-(--color-primary)"
                                    >
                                        {String(index + 1).padStart(2, '0')} {module.title}
                                    </a>
                                ))}
                            </div>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-(--color-border) bg-surface-soft/60 p-4">
                                    <p className="text-sm font-semibold text-(--color-primary-strong)">
                                        O que a plataforma resolve
                                    </p>
                                    <p className="mt-2 text-sm leading-7 text-(--color-muted)">
                                        Reduz decisões manuais, padroniza critérios da operação e
                                        entrega um histórico confiável da distribuição da gorjeta.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-(--color-border) bg-white p-4 shadow-sm">
                                    <p className="text-sm font-semibold text-(--color-primary-strong)">
                                        O que esta página apresenta
                                    </p>
                                    <p className="mt-2 text-sm leading-7 text-(--color-muted)">
                                        Uma visão detalhada de cada módulo, com estrutura pronta
                                        para receber imagens de telas e relatórios em PDF.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {modules.map((module, index) => (
                        <a
                            key={module.id}
                            href={`#${module.id}`}
                            className="panel rounded-2xl p-5 transition hover:-translate-y-0.5"
                        >
                            <p className="text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase">
                                {String(index + 1).padStart(2, '0')} {module.eyebrow}
                            </p>
                            <h2 className="mt-3 text-xl font-semibold text-(--color-primary-strong)">
                                {module.title}
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                                {module.summary}
                            </p>
                        </a>
                    ))}
                </section>

                <section className="space-y-6">
                    {modules.map((module, index) => (
                        <article id={module.id} key={module.id} className="panel overflow-hidden">
                            {(() => {
                                const previousModule = modules[index - 1]
                                const nextModule = modules[index + 1]

                                return (
                                    <div className="border-b border-(--color-border) bg-surface-soft/40 px-6 py-4 sm:px-8">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase">
                                                Navegação do módulo{' '}
                                                {String(index + 1).padStart(2, '0')}
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {previousModule ? (
                                                    <a
                                                        href={`#${previousModule.id}`}
                                                        className="inline-flex items-center justify-center rounded-full border border-(--color-border) bg-white px-3 py-2 text-xs font-semibold text-(--color-primary-strong) shadow-sm transition hover:border-(--color-primary-soft) hover:text-(--color-primary)"
                                                    >
                                                        ← Anterior
                                                    </a>
                                                ) : null}

                                                <a
                                                    href="#topo"
                                                    className="inline-flex items-center justify-center rounded-full border border-(--color-border) bg-white px-3 py-2 text-xs font-semibold text-(--color-primary-strong) shadow-sm transition hover:border-(--color-primary-soft) hover:text-(--color-primary)"
                                                >
                                                    Voltar ao início
                                                </a>

                                                {nextModule ? (
                                                    <a
                                                        href={`#${nextModule.id}`}
                                                        className="inline-flex items-center justify-center rounded-full border border-(--color-border) bg-white px-3 py-2 text-xs font-semibold text-(--color-primary-strong) shadow-sm transition hover:border-(--color-primary-soft) hover:text-(--color-primary)"
                                                    >
                                                        Próximo →
                                                    </a>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                                <div className="bg-surface-soft/60 px-6 py-8 sm:px-8 sm:py-10">
                                    <p className="text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase">
                                        {String(index + 1).padStart(2, '0')} {module.eyebrow}
                                    </p>
                                    <h3 className="mt-3 text-2xl font-semibold text-(--color-primary-strong) sm:text-3xl">
                                        {module.title}
                                    </h3>
                                    <p className="mt-4 text-sm leading-7 text-(--color-muted) sm:text-base sm:leading-8">
                                        {module.summary}
                                    </p>

                                    <div className="mt-6 space-y-4">
                                        {module.body.map((paragraph) => (
                                            <p
                                                key={paragraph}
                                                className="text-sm leading-7 text-(--color-muted) sm:text-base sm:leading-8"
                                            >
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>

                                    <div className="mt-6 rounded-2xl border border-(--color-border) bg-white p-4 shadow-sm">
                                        <p className="text-sm font-semibold text-(--color-primary-strong)">
                                            Destaques do módulo
                                        </p>
                                        <ul className="mt-3 space-y-3 text-sm leading-7 text-(--color-muted)">
                                            {module.highlights.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-white px-6 py-8 sm:px-8 sm:py-10">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="gold-bar-title text-sm font-semibold text-(--color-primary-strong)">
                                                Galeria do módulo
                                            </p>
                                            <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                                                Estrutura pronta para incluir capturas das telas e,
                                                quando existir, os relatórios em PDF
                                                correspondentes.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                                        {module.gallery.map((item) => (
                                            <div
                                                key={item}
                                                className="min-w-65 flex-1 snap-start rounded-3xl border border-dashed border-(--color-border) bg-[linear-gradient(180deg,#ffffff_0%,#eef5fb_100%)] p-5 shadow-sm"
                                            >
                                                <div className="flex h-44 items-center justify-center rounded-2xl border border-(--color-border) bg-white/80 text-center text-sm font-medium text-(--color-primary-weak)">
                                                    {item}
                                                </div>
                                                <p className="mt-4 text-sm font-semibold text-(--color-primary-strong)">
                                                    Espaço reservado
                                                </p>
                                                <p className="mt-2 text-sm leading-7 text-(--color-muted)">
                                                    Assim que você gerar as imagens deste módulo,
                                                    elas podem entrar aqui mantendo a navegação
                                                    lateral por arraste no desktop e no mobile.
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {modules[index - 1] ? (
                                            <a
                                                href={`#${modules[index - 1].id}`}
                                                className="inline-flex items-center justify-center rounded-xl border border-(--color-border) bg-white px-4 py-2 text-xs font-semibold text-(--color-primary-strong) transition hover:border-(--color-primary-soft) hover:text-(--color-primary)"
                                            >
                                                ← Módulo anterior
                                            </a>
                                        ) : null}

                                        <a
                                            href="#topo"
                                            className="inline-flex items-center justify-center rounded-xl border border-(--color-border) bg-white px-4 py-2 text-xs font-semibold text-(--color-primary-strong) transition hover:border-(--color-primary-soft) hover:text-(--color-primary)"
                                        >
                                            Voltar ao início
                                        </a>

                                        {modules[index + 1] ? (
                                            <a
                                                href={`#${modules[index + 1].id}`}
                                                className="inline-flex items-center justify-center rounded-xl border border-(--color-border) bg-white px-4 py-2 text-xs font-semibold text-(--color-primary-strong) transition hover:border-(--color-primary-soft) hover:text-(--color-primary)"
                                            >
                                                Próximo módulo →
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="panel overflow-hidden">
                    <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
                        <div className="bg-(--color-surface) px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                            <p className="gold-bar-title text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase">
                                Próximo passo
                            </p>
                            <h2 className="mt-4 text-2xl font-semibold text-(--color-primary-strong) sm:text-3xl">
                                Explore a plataforma e prepare a sua operação para um rateio mais
                                justo.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-(--color-muted) sm:text-base sm:leading-8">
                                Esta página já está pronta para receber as imagens reais de cada
                                módulo. Quando você me passar os nomes dos arquivos, eu encaixo tudo
                                aqui com a apresentação final.
                            </p>
                        </div>

                        <div className="bg-[linear-gradient(160deg,var(--color-primary-strong),var(--color-primary))] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                                <a
                                    className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                                    href="/login"
                                >
                                    Entrar no sistema
                                </a>
                                <a
                                    className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                                    href="/signup"
                                >
                                    Cadastrar empresa
                                </a>
                                <Link
                                    className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                                    href="/"
                                >
                                    Voltar para a página principal
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </section>
        </main>
    )
}
