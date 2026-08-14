import { detectarFormato, extrairItensHtml, extrairItensRss, extrairLista } from './parsers'
import type { ArtigoFonte, FonteConfig } from './types'

export async function fetchFonte(fonte: FonteConfig): Promise<ArtigoFonte[]> {
    try {
        const res = await fetch(fonte.url, {
            headers: {
                Accept: 'application/json, text/plain;q=0.9, text/xml;q=0.8, application/xml;q=0.8, */*;q=0.7',
            },
            cache: 'no-store',
        })

        if (!res.ok) {
            return []
        }

        const texto = await res.text()
        const formato = detectarFormato(texto, fonte)

        if (formato === 'json') {
            const payload: unknown = JSON.parse(texto)

            return extrairLista(payload).map((artigo) => ({
                ...artigo,
                fonte: artigo.fonte ?? fonte.nome ?? new URL(fonte.url).hostname,
            }))
        }

        const itens =
            formato === 'rss'
                ? extrairItensRss(texto, fonte.url)
                : extrairItensHtml(texto, fonte.url)

        return itens.map((item) => ({
            title: item.title,
            description: item.description,
            image: item.image,
            url: item.url,
            publishedAt: item.publishedAt,
            fonte: item.sourceName ?? fonte.nome ?? new URL(fonte.url).hostname,
        }))
    } catch {
        return []
    }
}
