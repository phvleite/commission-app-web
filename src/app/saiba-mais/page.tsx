import Image from 'next/image'
import Link from 'next/link'

type GalleryItem =
    | string
    | {
          title: string
          description: string
          src?: string
          alt?: string
          href?: string
          hrefLabel?: string
      }

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
            {
                title: 'Sem setores cadastrados',
                description:
                    'Soma dos percentuais em 0%, com os demais módulos ainda inabilitados.',
                src: '/showcase/sectors/img-sector-001.webp',
                alt: 'Tela de setores sem registros e percentuais em 0%',
            },
            {
                title: 'Primeiro setor cadastrado',
                description:
                    'Com 40% definidos, o sistema mostra o quanto ainda falta para liberar os módulos.',
                src: '/showcase/sectors/img-sector-002.webp',
                alt: 'Tela de setores com um setor cadastrado e soma de 40%',
            },
            {
                title: 'Setores com 100% concluído',
                description:
                    'Com a soma fechada em 100%, os outros módulos ficam liberados para a operação.',
                src: '/showcase/sectors/img-sector-003.webp',
                alt: 'Tela de setores com soma total de 100% e módulos liberados',
            },
            {
                title: 'Edição de setor',
                description: 'Exemplo de atualização de dados em um setor já cadastrado.',
                src: '/showcase/sectors/img-sector-004.webp',
                alt: 'Tela de edição de um setor cadastrado',
            },
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
        gallery: [
            {
                title: 'Cadastro de colaboradores vazio',
                description: 'Estado inicial do módulo, sem registros cadastrados para a empresa.',
                src: '/showcase/employees/img-employees-001.webp',
                alt: 'Tela do módulo Colaboradores sem registros cadastrados',
            },
            {
                title: 'Formulário de cadastro de colaborador',
                description:
                    'Exibe os campos para inclusão de um novo colaborador com vínculo ao setor.',
                src: '/showcase/employees/img-employees-002.webp',
                alt: 'Formulário de cadastro de colaborador no módulo Colaboradores',
            },
            {
                title: 'Listagem de colaboradores cadastrados',
                description:
                    'Visualização dos colaboradores já cadastrados com dados operacionais.',
                src: '/showcase/employees/img-employees-003.webp',
                alt: 'Listagem de colaboradores cadastrados no sistema',
            },
            {
                title: 'Filtro por demitidos',
                description:
                    'Neste estado a barra deixa de ser dourada e fica vermelha, destacando o status do colaborador demitido.',
                src: '/showcase/employees/img-employees-004.webp',
                alt: 'Filtro de colaboradores demitidos com barra vermelha de status',
            },
            {
                title: 'Edição de colaborador',
                description:
                    'Exemplo da tela de edição para atualizar dados de um colaborador existente.',
                src: '/showcase/employees/img-employees-005.webp',
                alt: 'Tela de edição de colaborador no módulo Colaboradores',
            },
        ],
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
            {
                title: 'Cadastro vazio com aviso de dependência',
                description:
                    'Estado inicial do módulo, mostrando que antes de cadastrar situações é necessário criar pelo menos um tipo de situação.',
                src: '/showcase/situations/img-situations-001.webp',
                alt: 'Tela vazia do módulo Situações com aviso para cadastrar tipo de situação primeiro',
            },
            {
                title: 'Cadastro de tipo e listagem de situações',
                description:
                    'Exibe o formulário para cadastrar tipo de situação e a listagem já disponível no módulo.',
                src: '/showcase/situations/img-situations-002.webp',
                alt: 'Tela do módulo Situações com cadastro de tipo e listagem de situações',
            },
            {
                title: 'Cadastro de situações',
                description:
                    'Tela de lançamento das situações por colaborador e período, com os dados necessários para o rateio.',
                src: '/showcase/situations/img-situations-003.webp',
                alt: 'Tela de cadastro de situações no sistema',
            },
            {
                title: 'Listagem com barras de status',
                description:
                    'Na listagem existem situações com barra vermelha e também uma ponta de barra dourada, refletindo estados visuais diferentes da operação.',
                src: '/showcase/situations/img-situations-004.webp',
                alt: 'Listagem de situações com barras vermelhas e detalhe de barra dourada',
            },
            {
                title: 'Relatório PDF de situações',
                description:
                    'Arquivo em PDF gerado pelo módulo para auditoria, conferência e impressão do período selecionado.',
                href: '/showcase/situations/relatorio-situacoes-1785960660906.pdf',
                hrefLabel: 'Abrir relatório em PDF',
            },
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
        gallery: [
            {
                title: 'Lançamento simples da venda',
                description:
                    'No módulo de vendas basta informar a data e o valor da venda para registrar a movimentação do dia.',
                src: '/showcase/sales/img-sales-001.webp',
                alt: 'Tela do módulo Vendas com campos de data e valor para lançamento',
            },
            {
                title: 'Valores de venda lançados',
                description:
                    'Exibe os valores já registrados no módulo, formando o histórico operacional das vendas lançadas.',
                src: '/showcase/sales/img-sales-002.webp',
                alt: 'Listagem com valores de vendas já lançados no sistema',
            },
            {
                title: 'Gorjetas por setor no dia',
                description:
                    'Ao clicar no botão para ver setores, o sistema detalha como a gorjeta daquele dia foi distribuída entre os setores.',
                src: '/showcase/sales/img-sales-003.webp',
                alt: 'Detalhamento das gorjetas por setor em um determinado dia',
            },
            {
                title: 'Alteração de lançamento de venda',
                description:
                    'Mostra a edição de um lançamento já realizado, permitindo corrigir dados antes de seguir a operação.',
                src: '/showcase/sales/img-sales-004.webp',
                alt: 'Tela de alteração de um lançamento de venda no módulo Vendas',
            },
            {
                title: 'Bloqueio de data já lançada',
                description:
                    'O sistema impede novo lançamento para uma data que já foi registrada, evitando duplicidade no cálculo.',
                src: '/showcase/sales/img-sales-005.webp',
                alt: 'Aviso do sistema informando que não é permitido lançar novamente uma data já registrada',
            },
        ],
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
        gallery: [
            {
                title: 'Tela inicial para consulta por período',
                description:
                    'Estado inicial do módulo, aguardando o lançamento do período inicial e final e, opcionalmente, a escolha de um colaborador para relatório individual.',
                src: '/showcase/commissions/img-commissions-001.webp',
                alt: 'Tela inicial do módulo Gorjetas com filtros de período e colaborador',
            },
            {
                title: 'Resumo por setor no período solicitado',
                description:
                    'Mostra a listagem consolidada dos valores de gorjeta por setor no período selecionado.',
                src: '/showcase/commissions/img-commissions-002.webp',
                alt: 'Resumo de gorjetas por setor no período solicitado',
            },
            {
                title: 'Gorjetas por colaborador',
                description:
                    'Exibe a lista detalhada de gorjetas distribuídas para cada colaborador no período consultado.',
                src: '/showcase/commissions/img-commissions-003.webp',
                alt: 'Listagem de gorjetas por colaborador',
            },
            {
                title: 'Situações consideradas no período',
                description:
                    'Apresenta as situações registradas no período, que compõem o contexto do cálculo das gorjetas.',
                src: '/showcase/commissions/img-commissions-004.webp',
                alt: 'Tela com situações do período no módulo de gorjetas',
            },
            {
                title: 'Visualização de relatório por colaborador',
                description:
                    'Prévia da consulta individual, focada em um colaborador específico no período selecionado.',
                src: '/showcase/commissions/img-commissions-005.webp',
                alt: 'Tela de relatório individual por colaborador no módulo de gorjetas',
            },
            {
                title: 'Relatório geral de gorjetas',
                description:
                    'Relatório consolidado por período com a visão geral da distribuição de gorjetas.',
                href: '/showcase/commissions/relatorio-geral-Gorjetas-20260805-180335.pdf',
                hrefLabel: 'Abrir relatório geral',
            },
            {
                title: 'Relatório de gorjetas por colaborador',
                description:
                    'Relatório individual com os dados de um colaborador específico no período consultado.',
                href: '/showcase/commissions/relatorio-Gorjetas-marli-bezerra-20260805-181430.pdf',
                hrefLabel: 'Abrir relatório individual',
            },
        ],
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
        gallery: [
            {
                title: 'Dados da empresa e usuário responsável',
                description:
                    'Tela com os dados da empresa e do usuário responsável principal da conta.',
                src: '/showcase/company-users/img-company-users-001.webp',
                alt: 'Dados da empresa e do usuário responsável no módulo Empresa e Usuários',
            },
            {
                title: 'Responsável no card da empresa',
                description:
                    'Destaque dos dados do responsável pela empresa exibidos no card de informações da empresa.',
                src: '/showcase/company-users/img-company-users-002.webp',
                alt: 'Card de dados da empresa com informações do responsável',
            },
            {
                title: 'Inserção de novo usuário',
                description: 'Exemplo de cadastro de um novo usuário autorizado dentro da empresa.',
                src: '/showcase/company-users/img-company-users-003.webp',
                alt: 'Tela de inserção de um novo usuário no módulo Empresa e Usuários',
            },
        ],
    },
] as const

export default function SaibaMaisPage() {
    return (
        <main
            id="topo"
            className="app-shell overflow-x-clip px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-12"
        >
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
                            <h2 className="gold-bar-title mt-3 text-xl font-semibold text-(--color-primary-strong)">
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
                                    <div className="border-b border-(--color-border) bg-surface-soft/40 px-6 py-3 sm:px-8 sm:py-4">
                                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase">
                                                Navegação do módulo{' '}
                                                {String(index + 1).padStart(2, '0')}
                                            </p>

                                            <div className="hidden flex-wrap gap-2 sm:flex">
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

                                            <a
                                                href="#topo"
                                                className="inline-flex items-center justify-center rounded-full border border-(--color-border) bg-white px-3 py-2 text-xs font-semibold text-(--color-primary-strong) shadow-sm transition hover:border-(--color-primary-soft) hover:text-(--color-primary) sm:hidden"
                                            >
                                                Voltar ao início
                                            </a>
                                        </div>
                                    </div>
                                )
                            })()}

                            <div className="grid min-w-0 gap-0 lg:grid-cols-[0.72fr_1.28fr]">
                                <div className="min-w-0 bg-surface-soft/60 px-6 py-6 sm:px-8 sm:py-10">
                                    <p className="text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase">
                                        {String(index + 1).padStart(2, '0')} {module.eyebrow}
                                    </p>
                                    <h3 className="gold-bar-title mt-2 text-2xl font-semibold text-(--color-primary-strong) sm:mt-3 sm:text-3xl">
                                        {module.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 text-(--color-muted) sm:mt-4 sm:text-base sm:leading-8">
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

                                <div className="min-w-0 bg-white px-6 py-6 sm:px-8 sm:py-10">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="gold-bar-title text-sm font-semibold text-(--color-primary-strong)">
                                                Galeria do módulo
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-1 lg:gap-6 lg:overflow-visible lg:pb-0 lg:snap-none">
                                        {(module.gallery as readonly GalleryItem[]).map((item) => {
                                            const galleryItem =
                                                typeof item === 'string' ? null : item
                                            const hasImage = Boolean(galleryItem?.src)
                                            const title =
                                                typeof item === 'string' ? item : item.title
                                            const description =
                                                typeof item === 'string'
                                                    ? 'Assim que você gerar as imagens deste módulo, elas podem entrar aqui mantendo a navegação lateral por arraste no desktop e no mobile.'
                                                    : item.description
                                            const key =
                                                typeof item === 'string'
                                                    ? item
                                                    : (item.src ?? item.href ?? item.title)

                                            return (
                                                <div
                                                    key={key}
                                                    className="min-w-[92%] flex-1 snap-start rounded-3xl border border-dashed border-(--color-border) bg-[linear-gradient(180deg,#ffffff_0%,#eef5fb_100%)] p-5 shadow-sm sm:min-w-120 lg:min-w-0"
                                                >
                                                    {hasImage ? (
                                                        <div className="mt-3 bg-white/60 p-2.5 shadow-[0_24px_44px_-14px_rgba(10,26,47,0.28)] sm:p-3.5">
                                                            <Image
                                                                src={galleryItem?.src ?? ''}
                                                                alt={galleryItem?.alt ?? title}
                                                                width={1600}
                                                                height={900}
                                                                className="h-auto w-full"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 flex min-h-44 flex-col items-center justify-center gap-3 bg-white/75 px-6 py-8 text-center shadow-[0_24px_44px_-14px_rgba(10,26,47,0.18)]">
                                                            <div className="rounded-full border border-(--color-border) bg-white px-4 py-2 text-xs font-semibold tracking-[0.18em] text-(--color-primary) uppercase">
                                                                Documento
                                                            </div>
                                                            <p className="max-w-sm text-sm font-medium text-(--color-primary-strong)">
                                                                {title}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <p className="mt-4 text-sm font-semibold text-(--color-primary-strong)">
                                                        {title}
                                                    </p>
                                                    <p className="mt-2 text-sm leading-7 text-(--color-muted)">
                                                        {description}
                                                    </p>
                                                    {galleryItem?.href ? (
                                                        <a
                                                            href={galleryItem.href}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="primary-button mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
                                                        >
                                                            {galleryItem.hrefLabel ??
                                                                'Abrir arquivo'}
                                                        </a>
                                                    ) : null}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="mt-6 hidden flex-wrap gap-2 sm:flex">
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

                            <p className="mt-4 text-sm font-semibold text-(--color-primary-strong) sm:text-base">
                                Contato:{' '}
                                <a
                                    href="mailto:contato@commission.com.br"
                                    className="text-(--color-primary) underline decoration-(--color-accent) underline-offset-3"
                                >
                                    contato@commission.com.br
                                </a>
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
                                    href="/planos"
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
