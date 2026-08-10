import type { FonteItem, FontePayload, FonteConfig, SourceKind, ArtigoFonte } from './types'
import { normalizarData, resolveUrl, stripTags, decodeEntities } from './utils'

export function extrairLista(payload: unknown): ArtigoFonte[] {
    if (Array.isArray(payload)) {
        return payload.filter(
            (item): item is ArtigoFonte => typeof item === 'object' && item !== null,
        )
    }

    if (typeof payload !== 'object' || payload === null) {
        return []
    }

    const data = payload as FontePayload
    const candidatos = [data.articles, data.items, data.data, data.results]

    for (const lista of candidatos) {
        if (Array.isArray(lista)) {
            return lista.filter(
                (item): item is ArtigoFonte => typeof item === 'object' && item !== null,
            )
        }
    }

    return []
}

function extraiaAtributo(bloco: string, atributo: string) {
    const match = bloco.match(new RegExp(`${atributo}="([^"]+)"`, 'i'))
    return match ? decodeEntities(match[1]) : undefined
}

function extrairItemRss(bloco: string, baseUrl: string): FonteItem | null {
    const titulo =
        bloco.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
        bloco.match(/<media:title[^>]*>([\s\S]*?)<\/media:title>/i)?.[1]
    const descricao =
        bloco.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ??
        bloco.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ??
        bloco.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]
    const link =
        extraiaAtributo(bloco, 'href') ??
        bloco.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ??
        bloco.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]
    const publicadoEm =
        bloco.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ??
        bloco.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] ??
        bloco.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1]
    const sourceName = bloco.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1]
    const imagem =
        bloco.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1] ??
        bloco.match(/<media:content[^>]*url="([^"]+)"/i)?.[1] ??
        bloco.match(/<enclosure[^>]*type="image\/[^"']+"[^>]*url="([^"]+)"/i)?.[1] ??
        bloco.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image\/[^"']+"/i)?.[1]

    const tituloLimpo = titulo ? stripTags(titulo) : ''
    const descricaoLimpa = descricao ? stripTags(descricao) : ''
    const url = resolveUrl(baseUrl, stripTags(link ?? ''))

    if (!tituloLimpo || !url) {
        return null
    }

    return {
        title: tituloLimpo,
        description: descricaoLimpa || undefined,
        url,
        image: imagem,
        publishedAt: normalizarData(publicadoEm),
        sourceName: sourceName ? stripTags(sourceName) : undefined,
    }
}

export function extrairItensRss(texto: string, baseUrl: string): FonteItem[] {
    const blocos = [
        ...texto.matchAll(/<item[\s\S]*?<\/item>/gi),
        ...texto.matchAll(/<entry[\s\S]*?<\/entry>/gi),
    ]

    return blocos
        .map((match) => extrairItemRss(match[0], baseUrl))
        .filter((item): item is FonteItem => item !== null)
}

export function extrairItensHtml(texto: string, baseUrl: string): FonteItem[] {
    const vistos = new Set<string>()
    const itens: FonteItem[] = []
    const padroes = [...texto.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]

    for (const match of padroes) {
        const url = resolveUrl(baseUrl, match[1])
        const titulo = stripTags(match[2])

        if (!url || vistos.has(url)) {
            continue
        }

        if (titulo.length < 20 || titulo.length > 180) {
            continue
        }

        if (
            /^(home|menu|sobre|contato|assine|imprensa|not[ií]cias|leia mais|ver mais|categorias)$/i.test(
                titulo,
            )
        ) {
            continue
        }

        vistos.add(url)
        itens.push({
            title: titulo,
            description: titulo,
            url,
        })

        if (itens.length >= 12) {
            break
        }
    }

    return itens
}

export function detectarFormato(texto: string, fonte: FonteConfig): SourceKind {
    if (fonte.kind && fonte.kind !== 'auto') {
        return fonte.kind
    }

    const amostra = texto.trimStart()

    if (/^\s*<\?xml|<rss\b|<feed\b/i.test(amostra)) {
        return 'rss'
    }

    if (/^\s*\{/.test(amostra) || /^\s*\[/.test(amostra)) {
        return 'json'
    }

    return 'html'
}
