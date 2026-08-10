export type Categoria = 'geral' | 'tributario' | 'operacao' | 'tendencias'

export type SourceKind = 'auto' | 'json' | 'rss' | 'html'

export type ArtigoFonte = {
    id?: string
    url?: string
    title?: string
    description?: string
    content?: string
    image?: string
    publishedAt?: string
    data?: string
    fonte?: string
    source?: {
        name?: string
    }
}

export type FontePayload = {
    articles?: ArtigoFonte[]
    items?: ArtigoFonte[]
    data?: ArtigoFonte[]
    results?: ArtigoFonte[]
}

export type FonteConfig = {
    url: string
    nome?: string
    kind?: SourceKind
}

export type FonteItem = {
    title: string
    description?: string
    url: string
    image?: string
    publishedAt?: string
    sourceName?: string
}

export type NormalizedArticle = {
    id: string
    titulo: string
    descricao: string
    imagem?: string
    fonte: string
    url: string
    publicadoEm: string
    categoria: Categoria
}
