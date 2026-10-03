import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import { createPdfReport } from '@/lib/pdf/report'
import { generateSituationsPdf } from '@/services/pdf/situations'

async function readPages(bytes: Uint8Array): Promise<string[]> {
    const pdf = await PDFDocument.load(bytes)
    return pdf.getPages().map((page) => {
        const contents = page.node.Contents()
        const streams = contents instanceof PDFArray ? contents.asArray() : [contents]
        return streams
            .map((entry) => {
                const stream = pdf.context.lookup(entry)
                if (!(stream instanceof PDFRawStream)) throw new Error('Conteúdo PDF ausente.')
                const operators = Buffer.from(decodePDFRawStream(stream).decode()).toString()
                return [...operators.matchAll(/<([0-9a-f]+)>/gi)]
                    .map((match) => Buffer.from(match[1], 'hex').toString('latin1'))
                    .join('')
            })
            .join('')
    })
}

const signature = { companyName: 'Empresa São João', website: 'https://www.commission.com.br' }

describe('PDFKit reports', () => {
    it('generates an empty situation report with filters and institutional signature', async () => {
        const bytes = await generateSituationsPdf(
            {
                generatedAt: '2026-10-03T12:00:00.000Z',
                situations: [],
            },
            signature,
        )
        const pages = await readPages(bytes)

        expect(pages).toHaveLength(1)
        expect(pages[0]).toContain('Relatório de Situações')
        expect(pages[0]).toContain('Colaborador: Todos')
        expect(pages[0]).toContain('Situações exibidas (0)')
        expect(pages[0]).toContain('Empresa São João')
        expect(pages[0]).toContain(signature.website)
        expect(pages[0]).toContain('contato@commission.com.br')
        expect(pages[0]).toContain('Página 1 de 1')
    })

    it('paginates long lists and repeats table headers and signatures on every page', async () => {
        const situations = Array.from({ length: 140 }, (_, index) => ({
            employeeName: `Colaborador ${index}: Fernanda Maria de Torres Silva e João da Conceição`,
            typeDescription: 'Férias e suspensão temporária',
            startDate: '2026-10-01',
            endDate: '2026-10-03',
            active: index % 2 === 0,
        }))
        const bytes = await generateSituationsPdf(
            {
                title: 'Relatório de Situações',
                filters: { sector: 'Operação', startDate: '2026-10-01', endDate: '2026-10-03' },
                situations,
            },
            signature,
        )
        const pages = await readPages(bytes)

        expect(pages.length).toBeGreaterThan(1)
        for (const [index, page] of pages.entries()) {
            expect(page).toContain('Relatório de Situações')
            expect(page).toContain('Colaborador')
            expect(page).toContain('Data Inicial')
            expect(page).toContain('Data Final')
            expect(page).toContain('Status')
            expect(page).toContain(signature.companyName)
            expect(page).toContain(`Página ${index + 1} de ${pages.length}`)
        }
        const text = pages.join('')
        for (const row of situations) expect(text).toContain(row.employeeName)
        expect(text).toContain('Férias e suspensão temporária')
        expect(text).toContain('01/10/2026')
        expect(text).toContain('03/10/2026')
        expect(text).toContain('Ativo')
        expect(text).toContain('Inativo')
    })

    it('rejects render failures without leaving the PDF stream running', async () => {
        await expect(
            createPdfReport({ title: 'Teste', ...signature }, () => {
                throw new Error('Falha de renderização')
            }),
        ).rejects.toThrow('Falha de renderização')
    })
})
