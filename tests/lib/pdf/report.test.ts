import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import { createPdfReport } from '@/lib/pdf/report'
import { generateCommissionAllPdf } from '@/services/pdf/commissions-all'
import { generateCommissionEmployeePdf } from '@/services/pdf/commissions-employee'
import { generateMeritocracyPdf } from '@/services/pdf/meritocracy'
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

    it('sorts meritocracy recipients and displays cancellation details and totals', async () => {
        const bytes = await generateMeritocracyPdf(
            {
                competence: '2027-05',
                paymentDate: '2027-05-31T00:00:00.000Z',
                totalMeritocracyValue: 1000,
                recipientCount: 2,
                status: 'cancelled',
                cancelReason: 'Revisão do lançamento',
                recipients: [
                    { employeeName: 'Zélia', sectorName: 'Vendas', employeeValue: 700 },
                    { employeeName: 'Ana', sectorName: 'Atendimento', employeeValue: 300 },
                ],
            },
            signature,
        )
        const pages = await readPages(bytes)
        const text = pages.join('')

        expect(pages).toHaveLength(1)
        expect(text).toContain('Maio/2027')
        expect(text).toContain('Data de pagamento: 31/05/2027')
        expect(text).toContain('Status: Cancelado - Revisão do lançamento')
        expect(text).toContain('Total Geral: R$ 10,00')
        expect(text.indexOf('Ana')).toBeLessThan(text.indexOf('Zélia'))
        expect(text).toContain('Atendimento')
        expect(text).toContain('Empresa São João')
        expect(text).toContain('Página 1 de 1')
    })

    it('renders general commission summaries, server meritocracy, and sorted situations', async () => {
        const bytes = await generateCommissionAllPdf({
            title: 'GORJETAS REF. 07/2026',
            payload: {
                startDate: '2026-07-01',
                endDate: '2026-07-31',
                data: [
                    { employeeName: 'Zélia', sectorName: 'Vendas', employeeValue: 400 },
                    { employeeName: 'Ana', sectorName: 'Atendimento', employeeValue: 300 },
                    { employeeName: 'Ana', sectorName: 'Atendimento', employeeValue: 200 },
                ],
                sectorSummary: [
                    { sectorName: 'Vendas', sectorValue: 400 },
                    { sectorName: 'MERITOCRACIA', sectorValue: 250 },
                ],
                salesSummary: [{ value: 10000, totalCommissionValue: 900 }],
                situations: [
                    {
                        date: '2026-07-01T12:00:00.000Z',
                        employeeName: 'Bruno',
                        sectorName: 'Atendimento',
                        totalCount: 2,
                        eligibleCount: 1,
                        situation: 'Falta',
                    },
                    {
                        date: '2026-07-02',
                        employeeName: 'Zélia',
                        sectorName: 'Vendas',
                        totalCount: 3,
                        eligibleCount: 2,
                        situation: 'Férias',
                    },
                    {
                        date: '2026-07-01',
                        employeeName: 'Ana',
                        sectorName: 'Atendimento',
                        totalCount: 2,
                        eligibleCount: 1,
                        situation: 'Apto',
                    },
                ],
            },
            meritocracyTotal: 250,
            companyName: signature.companyName,
            website: signature.website,
        })
        const pages = await readPages(bytes)
        const text = pages.join('')

        expect(pages).toHaveLength(1)
        expect(text).toContain('Valor total das vendas: R$ 100,00')
        expect(text).toContain('Total de gorjetas do período: R$ 9,00')
        expect(text).toContain('Meritocracia paga no período: R$ 2,50')
        expect(text).toContain('Total dos Setores (sem meritocracia): R$ 4,00')
        expect(text).toContain('Total Geral (Gorjetas + Meritocracia): R$ 11,50')
        expect(text.indexOf('Ana')).toBeLessThan(text.indexOf('Zélia'))
        expect(text.indexOf('01/07/2026')).toBeLessThan(text.indexOf('02/07/2026'))
        expect(text.match(/01\/07\/2026/g)).toHaveLength(1)
        expect(text).toContain('Bruno')
        expect(text).toContain('Qtd. Aptos')
        expect(text).toContain('Férias')
        expect(text).toContain('Empresa São João')
    })

    it('renders employee meritocracy details in chronological order and keeps totals separate', async () => {
        const bytes = await generateCommissionEmployeePdf({
            title: 'GORJETAS DE ALICE - REF. JULHO/2026',
            payload: {
                startDate: '2026-07-01',
                endDate: '2026-07-31',
                employeeId: 'employee-1',
                data: [
                    {
                        date: '2026-07-02T00:00:00.000Z',
                        employeeName: 'Alice',
                        sectorName: 'Vendas',
                        situation: 'Férias',
                        totalCount: 2,
                        eligibleCount: 1,
                        sectorValue: 500,
                        employeeValue: 250,
                    },
                ],
                sectorSummary: [{ sectorName: 'Vendas', sectorValue: 500, employeeValue: 250 }],
            },
            meritocracyValue: 150,
            meritocracyEntries: [
                {
                    date: new Date('2026-07-01T00:00:00.000Z'),
                    employeeName: 'Alice',
                    sectorName: 'MERITOCRACIA',
                    employeeValue: 150,
                },
            ],
            companyName: signature.companyName,
            website: signature.website,
        })
        const pages = await readPages(bytes)
        const text = pages.join('')

        expect(pages).toHaveLength(1)
        expect(text).toContain('Detalhamento das Gorjetas')
        expect(text.indexOf('01/07/2026')).toBeLessThan(text.indexOf('02/07/2026'))
        expect(text).toContain('Meritocracia')
        expect(text).toContain('R$ 1,50')
        expect(text).toContain('R$ 2,50')
        expect(text).toContain('Total de Gorjetas: R$ 2,50')
        expect(text).toContain('Total Geral (Gorjetas + Meritocracia): R$ 4,00')
        expect(text).toContain('Página 1 de 1')
    })

    it('rejects render failures without leaving the PDF stream running', async () => {
        await expect(
            createPdfReport({ title: 'Teste', ...signature }, () => {
                throw new Error('Falha de renderização')
            }),
        ).rejects.toThrow('Falha de renderização')
    })
})
