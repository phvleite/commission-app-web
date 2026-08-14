import type { FonteConfig } from './types'

export const DEFAULT_SOURCES: FonteConfig[] = [
    {
        url: 'https://news.google.com/rss/search?q=site%3Aabrasel.com.br%2Fnoticias+bares+restaurantes&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        nome: 'Abrasel',
        kind: 'rss',
    },
    {
        url: 'https://news.google.com/rss/search?q=site%3Aanrbrasil.org.br+alimenta%C3%A7%C3%A3o+mercado+restaurantes&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        nome: 'ANR',
        kind: 'rss',
    },
    {
        url: 'https://news.google.com/rss/search?q=alimenta%C3%A7%C3%A3o+fora+do+lar&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        nome: 'Google Notícias',
        kind: 'rss',
    },
    {
        url: 'https://news.google.com/rss/search?q=bares+restaurantes+Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        nome: 'Google Notícias',
        kind: 'rss',
    },
]

export function parseFontes(envValue?: string): FonteConfig[] {
    const configuradas: FonteConfig[] = envValue
        ? envValue
              .split(/[,;\n]+/)
              .map((item) => item.trim())
              .filter(Boolean)
              .map<FonteConfig>((item) => {
                  const [url, nome, kind] = item.split('|').map((parte) => parte.trim())

                  return {
                      url,
                      nome: nome || undefined,
                      kind: kind === 'rss' || kind === 'html' || kind === 'json' ? kind : 'auto',
                  }
              })
              .filter((fonte) => Boolean(fonte.url))
        : []

    const fontes = [...configuradas, ...DEFAULT_SOURCES]
    const vistos = new Set<string>()

    return fontes.filter((fonte) => {
        const chave = `${fonte.url}|${fonte.nome ?? ''}`.toLowerCase()

        if (vistos.has(chave)) {
            return false
        }

        vistos.add(chave)
        return true
    })
}
