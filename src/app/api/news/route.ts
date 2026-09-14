import { connectDB } from '@/lib/db'
import { NewsArticle } from '@/models/NewsArticle'
import { ensureNewsFresh } from '@/services/news/sync'
import type { Categoria } from './_lib/types'
import { resumir, stripTags } from './_lib/utils'

const PAGE_SIZE = 6

function isDatabaseConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()
    const name = (error as Error & { name?: string }).name?.toLowerCase() ?? ''
    const code = (error as Error & { code?: string }).code?.toString().toLowerCase() ?? ''

    return (
        name.includes('mongo') ||
        name.includes('mongoose') ||
        name.includes('network') ||
        message.includes('connection lost') ||
        message.includes('timed out') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('timeout') ||
        code.includes('econn') ||
        code.includes('timedout')
    )
}

function normalizeImageUrl(image?: string) {
    if (!image) return undefined

    try {
        const url = new URL(image)
        return url.protocol === 'https:' && url.pathname !== '/' ? url.toString() : undefined
    } catch {
        return undefined
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') ?? '1')
    const categoria = (searchParams.get('categoria') ?? 'geral') as Categoria

    try {
        await connectDB()
        await ensureNewsFresh()

        const filter = categoria === 'geral' ? {} : { categories: categoria }
        const total = await NewsArticle.countDocuments(filter)
        const noticias = await NewsArticle.find(filter)
            .sort({ publishedAt: -1 })
            .skip((Math.max(page, 1) - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .lean()

        return Response.json({
            origem: noticias.length > 0 ? 'api' : 'vazia',
            page,
            total,
            pageSize: PAGE_SIZE,
            noticias: noticias.map((noticia) => ({
                id: noticia._id.toString(),
                titulo: noticia.title,
                descricao: resumir(stripTags(noticia.description)),
                imagem: normalizeImageUrl(noticia.image),
                fonte: noticia.source,
                url: noticia.url,
                publicadoEm: noticia.publishedAt.toISOString(),
                categoria,
            })),
        })
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            return Response.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return Response.json({ error: 'Erro ao consultar notícias.' }, { status: 500 })
    }
}
