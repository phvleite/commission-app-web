'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

type CategoriaFiltro = 'geral' | 'tributario' | 'operacao' | 'tendencias'

type NoticiaApi = {
    id: string
    titulo: string
    descricao: string
    imagem?: string
    fonte: string
    url: string
    publicadoEm: string
}

type Noticia = NoticiaApi

const categorias: Array<{ value: CategoriaFiltro; label: string }> = [
    { value: 'geral', label: 'Geral' },
    { value: 'tributario', label: 'Tributário' },
    { value: 'operacao', label: 'Operação' },
    { value: 'tendencias', label: 'Tendências' },
]

const filtroLabels: Record<CategoriaFiltro, string> = {
    geral: 'Geral',
    tributario: 'Tributário',
    operacao: 'Operação',
    tendencias: 'Tendências',
}

export default function NoticiasCarousel() {
    const [categoria, setCategoria] = useState<CategoriaFiltro>('geral')
    const [indice, setIndice] = useState(0)
    const [noticias, setNoticias] = useState<Noticia[]>([])
    const [carregando, setCarregando] = useState(true)
    const [origemApi, setOrigemApi] = useState<'api' | 'vazia'>('vazia')
    const [imagemComErro, setImagemComErro] = useState<string | null>(null)

    useEffect(() => {
        let ativo = true

        async function carregarNoticias() {
            setCarregando(true)

            try {
                const resposta = await fetch(`/api/news?categoria=${categoria}&page=1`, {
                    cache: 'no-store',
                })

                if (!resposta.ok) {
                    throw new Error('Falha ao carregar notícias')
                }

                const dados: { origem?: 'api' | 'vazia'; noticias?: NoticiaApi[] } =
                    await resposta.json()
                const recebidas = (dados.noticias ?? []).map((noticia) => ({
                    id: noticia.id,
                    titulo: noticia.titulo,
                    descricao: noticia.descricao,
                    imagem: noticia.imagem,
                    fonte: noticia.fonte,
                    url: noticia.url,
                    publicadoEm: noticia.publicadoEm,
                })) as Noticia[]

                if (!ativo) return

                setOrigemApi(dados.origem === 'api' && recebidas.length > 0 ? 'api' : 'vazia')
                setNoticias(recebidas)
                setIndice(0)
            } catch {
                if (!ativo) return

                setOrigemApi('vazia')
                setNoticias([])
                setIndice(0)
            } finally {
                if (ativo) {
                    setCarregando(false)
                }
            }
        }

        carregarNoticias()

        return () => {
            ativo = false
        }
    }, [categoria])

    useEffect(() => {
        if (noticias.length <= 1) {
            return undefined
        }

        const timer = window.setInterval(() => {
            setIndice((atual) => (atual + 1) % noticias.length)
        }, 6500)

        return () => window.clearInterval(timer)
    }, [noticias.length])

    const noticiaAtual = noticias[indice]

    const indicadores = noticias
        .map((noticia, position) => ({ noticia, position }))
        .filter(({ position }) => position !== indice)
        .slice(0, 3)

    return (
        <section className="news-carousel bg-white">
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-(--color-primary) uppercase">
                        Atualizações do setor
                    </p>
                    <h2 className="gold-bar-title mt-2 text-xl font-semibold text-(--color-primary-strong)">
                        Em destaque
                    </h2>
                </div>

                <div className="flex flex-wrap gap-1.5" aria-label="Categorias de notícias">
                    {categorias.map((categoriaItem) => (
                        <button
                            key={categoriaItem.value}
                            type="button"
                            onClick={() => setCategoria(categoriaItem.value)}
                            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                categoria === categoriaItem.value
                                    ? 'border-(--color-accent) bg-(--color-accent) text-(--color-primary-strong) shadow-sm'
                                    : 'border-(--color-border) bg-white text-(--color-primary-strong) hover:border-(--color-primary-soft) hover:bg-surface-soft'
                            }`}
                        >
                            {categoriaItem.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid border-t border-(--color-border) lg:grid-cols-[minmax(0,1fr)_18rem]">
                <article className="news-carousel-slide min-w-0 bg-surface-soft/55">
                    {carregando ? (
                        <div className="flex h-80 items-center justify-center text-sm text-(--color-muted)">
                            Carregando notícias...
                        </div>
                    ) : noticiaAtual ? (
                        <div className="grid min-h-80 sm:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
                            <div className="relative min-h-48 overflow-hidden bg-(--color-primary-strong) sm:min-h-80">
                                {noticiaAtual.imagem && imagemComErro !== noticiaAtual.id ? (
                                    <Image
                                        src={noticiaAtual.imagem}
                                        alt={noticiaAtual.titulo}
                                        fill
                                        unoptimized
                                        priority={indice === 0}
                                        onError={() => setImagemComErro(noticiaAtual.id)}
                                        className="object-cover"
                                        sizes="(max-width: 640px) 100vw, 35vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-(--color-primary-strong) via-(--color-primary) to-(--color-primary-soft)">
                                        <span className="max-w-xs px-8 text-center text-xl font-semibold text-white/90">
                                            {noticiaAtual.fonte}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-linear-to-t from-primary-strong/80 via-primary-strong/20 to-transparent" />

                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white">
                                        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                                            {filtroLabels[categoria]}
                                        </span>
                                        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                                            {noticiaAtual.fonte}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-col justify-center p-5 sm:p-6">
                                <p className="text-xs uppercase tracking-widest text-(--color-accent-strong)">
                                    {origemApi === 'api'
                                        ? 'Notícia atualizada'
                                        : 'Fonte temporariamente indisponível'}
                                </p>
                                <h3 className="mt-2 line-clamp-3 text-xl leading-tight font-semibold text-(--color-primary-strong) sm:text-2xl">
                                    {noticiaAtual.titulo}
                                </h3>
                                <p className="mt-3 line-clamp-2 text-sm leading-6 text-(--color-muted)">
                                    {noticiaAtual.descricao}
                                </p>

                                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                                    <a
                                        className="primary-button rounded-xl px-4 py-2.5 font-semibold"
                                        href={noticiaAtual.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Acessar notícia
                                    </a>
                                    <span className="text-xs uppercase tracking-widest text-(--color-muted)">
                                        {new Date(noticiaAtual.publicadoEm).toLocaleDateString(
                                            'pt-BR',
                                            {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            },
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-80 items-center justify-center p-6 text-sm text-(--color-muted)">
                            Notícias indisponíveis no momento.
                        </div>
                    )}
                </article>

                <aside className="bg-(--color-primary-strong) p-4 text-white">
                    <p className="text-xs font-semibold tracking-widest text-white/65 uppercase">
                        Mais notícias
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                        {indicadores.length > 0 ? (
                            indicadores.map(({ noticia, position }) => (
                                <button
                                    key={noticia.id}
                                    type="button"
                                    onClick={() => setIndice(position)}
                                    className="news-carousel-dot flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-white/85 transition hover:border-accent/70 hover:bg-white/10"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                                        {String(position + 1).padStart(2, '0')}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-2 block text-xs leading-5 font-semibold">
                                            {noticia.titulo}
                                        </span>
                                        <span className="mt-1 block text-[0.65rem] tracking-widest text-white/55 uppercase">
                                            {noticia.fonte}
                                        </span>
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                                Nenhuma outra notícia.
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </section>
    )
}
