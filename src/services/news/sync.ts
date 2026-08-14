import { connectDB } from '@/lib/db'
import { NewsArticle } from '@/models/NewsArticle'
import { fetchFonte } from '@/app/api/news/_lib/fetch-source'
import { parseFontes } from '@/app/api/news/_lib/sources'

const REFRESH_INTERVAL_MS = 30 * 60 * 1000
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

let activeSync: Promise<void> | null = null

function normalizeText(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
}

function classifyArticle(title: string, description: string) {
    const text = normalizeText(`${title} ${description}`)
    const categories = ['geral']

    if (text.includes('tribut') || text.includes('fiscal') || text.includes('imposto')) {
        categories.push('tributario')
    }

    if (text.includes('oper') || text.includes('gestao') || text.includes('trabalh')) {
        categories.push('operacao')
    }

    if (text.includes('tend') || text.includes('mercado') || text.includes('consumo')) {
        categories.push('tendencias')
    }

    return categories
}

function cleanTitle(title: string, source: string) {
    const suffix = new RegExp(`\\s+-\\s+${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    return title.replace(suffix, '').trim()
}

function isEditorialTitle(title: string) {
    const normalized = normalizeText(title)

    return ![
        /^home(?:\s+-|$)/,
        /^eventos? de /,
        /^noticias(?: anr)?(?:\s+-|$)/,
        /^dados do setor(?:\s+-|$)/,
        /^solucoes anr(?:\s+-|$)/,
        /^diretoria(?:\s+-|$)/,
        /^associe-se(?:\s+-|$)/,
    ].some((pattern) => pattern.test(normalized))
}

async function synchronize() {
    await connectDB()

    const sources = parseFontes(process.env.NEWS_API_SOURCES)
    const fetched = (await Promise.all(sources.map(fetchFonte))).flat()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + RETENTION_MS)
    const byUrl = new Map(fetched.filter((item) => item.url).map((item) => [item.url, item]))

    if (byUrl.size === 0) {
        return
    }

    const operations = [...byUrl.values()].flatMap((item) => {
        const source = item.source?.name ?? item.fonte ?? 'Fonte'
        const title = cleanTitle(item.title ?? 'Notícia sem título', source)
        const description = item.description ?? item.content ?? ''

        if (!isEditorialTitle(title)) {
            return []
        }

        return [
            {
                updateOne: {
                    filter: { url: item.url },
                    update: {
                        $set: {
                            title,
                            description,
                            image: item.image || undefined,
                            source,
                            publishedAt: item.publishedAt ? new Date(item.publishedAt) : now,
                            categories: classifyArticle(title, description),
                            syncedAt: now,
                            expiresAt,
                        },
                    },
                    upsert: true,
                },
            },
        ]
    })

    if (operations.length > 0) {
        await NewsArticle.bulkWrite(operations, { ordered: false })
    }
}

export async function ensureNewsFresh() {
    await connectDB()

    const latest = await NewsArticle.findOne().sort({ syncedAt: -1 }).select({ syncedAt: 1 }).lean()
    const isStale = !latest || latest.syncedAt.getTime() < Date.now() - REFRESH_INTERVAL_MS

    if (!isStale) {
        return
    }

    activeSync ??= synchronize().finally(() => {
        activeSync = null
    })

    await activeSync
}
