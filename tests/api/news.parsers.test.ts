import { extrairItensRss } from '@/app/api/news/_lib/parsers'
import { stripTags } from '@/app/api/news/_lib/utils'

describe('news RSS parser', () => {
    it('removes escaped HTML before exposing a description', () => {
        const description =
            '&lt;a href="https://example.com/news"&gt;Título da notícia&lt;/a&gt;&amp;nbsp;&lt;font&gt;Fonte&lt;/font&gt;'

        expect(stripTags(description)).toBe('Título da notícia Fonte')
    })

    it('does not treat the source website URL as an image', () => {
        const rss = `
            <item>
                <title>Notícia sobre alimentação fora do lar</title>
                <link>https://example.com/news</link>
                <description>Descrição da notícia</description>
                <source url="https://example.com">Portal Exemplo</source>
            </item>
        `

        expect(extrairItensRss(rss, 'https://example.com/feed')).toEqual([
            expect.objectContaining({
                image: undefined,
                sourceName: 'Portal Exemplo',
            }),
        ])
    })
})
