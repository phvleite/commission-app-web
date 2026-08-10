export function resumir(texto: string, max = 220) {
    if (!texto) return ''

    return texto.length > max ? `${texto.slice(0, max)}...` : texto
}

export function decodeEntities(texto: string) {
    const entidades: Record<string, string> = {
        amp: '&',
        apos: "'",
        gt: '>',
        lt: '<',
        nbsp: ' ',
        quot: '"',
    }

    const decodeOnce = (value: string) =>
        value
            .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
            .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
                String.fromCharCode(Number.parseInt(code, 16)),
            )
            .replace(
                /&([a-z]+);/gi,
                (_match, entity: string) => entidades[entity.toLowerCase()] ?? `&${entity};`,
            )

    return decodeOnce(decodeOnce(texto))
}

export function stripTags(texto: string) {
    return decodeEntities(texto)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export function resolveUrl(baseUrl: string, link?: string) {
    if (!link) return undefined

    try {
        return new URL(link, baseUrl).toString()
    } catch {
        return undefined
    }
}

export function normalizarData(valor?: string) {
    if (!valor) return undefined

    const data = new Date(stripTags(valor))
    return Number.isNaN(data.getTime()) ? undefined : data.toISOString()
}
