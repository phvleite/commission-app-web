/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CommissionsReportAll from '@/app/dashboard/commissions/components/CommissionsReportAll'
import type { CommissionsAllResult } from '@/app/dashboard/commissions/CommissionsClient'

jest.mock('@/app/dashboard/commissions/hooks/useCommissions', () => ({
    useCommissions: () => ({
        getPeriodTitle: () => 'Relatorio Geral - Julho/2026',
        groupByEmployee: () => [
            { employeeName: 'Alice', sectorName: 'Setor A', totalCommission: 5000 },
            { employeeName: 'Bruno', sectorName: 'Setor B', totalCommission: 2000 },
        ],
        calculateTotal: () => 7000,
    }),
}))

function buildResult(): CommissionsAllResult {
    return {
        type: 'all',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        data: [
            {
                date: '2026-07-01',
                employeeName: 'Alice',
                sectorName: 'Setor A',
                situation: 'Apto',
                sectorValue: 7000,
                employeeValue: 5000,
                eligibleCount: 2,
                totalCount: 2,
            },
            {
                date: '2026-07-01',
                employeeName: 'Bruno',
                sectorName: 'Setor B',
                situation: 'Apto',
                sectorValue: 3000,
                employeeValue: 2000,
                eligibleCount: 1,
                totalCount: 1,
            },
        ],
        sectorSummary: [
            { sectorName: 'Setor A', sectorValue: 7000 },
            { sectorName: 'MERITOCRACIA', sectorValue: 3000 },
        ],
        salesSummary: [
            { value: 10000, totalCommissionValue: 1000 },
            { value: 20000, totalCommissionValue: 2000 },
        ],
        situations: [],
    }
}

describe('CommissionsReportAll', () => {
    const originalCreateElement = document.createElement.bind(document)
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL

    beforeEach(() => {
        global.fetch = jest.fn()

        Object.defineProperty(URL, 'createObjectURL', {
            writable: true,
            configurable: true,
            value: jest.fn(() => 'blob:mock-url'),
        })

        Object.defineProperty(URL, 'revokeObjectURL', {
            writable: true,
            configurable: true,
            value: jest.fn(),
        })

        jest.spyOn(window, 'open').mockImplementation(() => null)
    })

    afterEach(() => {
        jest.restoreAllMocks()

        Object.defineProperty(URL, 'createObjectURL', {
            writable: true,
            configurable: true,
            value: originalCreateObjectURL,
        })

        Object.defineProperty(URL, 'revokeObjectURL', {
            writable: true,
            configurable: true,
            value: originalRevokeObjectURL,
        })
    })

    it('renders title and calculated totals', () => {
        render(<CommissionsReportAll result={buildResult()} />)

        expect(screen.getByText('Relatorio Geral - Julho/2026')).toBeInTheDocument()
        expect(screen.getByText('Valor total das vendas:')).toBeInTheDocument()
        expect(screen.getByText('Gorjetas total do período:')).toBeInTheDocument()
        expect(screen.getByText('Total dos Setores (sem meritocracia)')).toBeInTheDocument()
        expect(screen.getByText('Total Geral: R$ 70,00')).toBeInTheDocument()
    })

    it('does not export when pdf endpoint fails', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce({ ok: false } as Response)

        render(<CommissionsReportAll result={buildResult()} />)

        fireEvent.click(screen.getByRole('button', { name: 'Gerar PDF' }))

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                '/api/pdf/commissions/all',
                expect.objectContaining({ method: 'POST' }),
            )
        })

        expect(window.open).not.toHaveBeenCalled()
        expect(URL.createObjectURL).not.toHaveBeenCalled()
    })

    it('exports pdf and triggers download when endpoint succeeds', async () => {
        jest.useFakeTimers()

        const blob = new Blob(['pdf'])
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce({
            ok: true,
            blob: async () => blob,
        } as Response)

        let createdAnchor: HTMLAnchorElement | null = null
        jest.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
            const element = originalCreateElement(tagName) as HTMLElement
            if (tagName.toLowerCase() === 'a') {
                createdAnchor = element as HTMLAnchorElement
                jest.spyOn(createdAnchor, 'click').mockImplementation(() => {})
            }
            return element
        }) as typeof document.createElement)

        render(<CommissionsReportAll result={buildResult()} />)
        fireEvent.click(screen.getByRole('button', { name: 'Gerar PDF' }))

        await waitFor(() => {
            expect(window.open).toHaveBeenCalledWith(
                'blob:mock-url',
                '_blank',
                'noopener,noreferrer',
            )
        })

        expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
        expect(createdAnchor).not.toBeNull()
        expect(createdAnchor?.download).toMatch(/^relatorio-geral-Gorjetas-\d{8}-\d{6}\.pdf$/)

        jest.advanceTimersByTime(60_000)
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

        jest.useRealTimers()
    })
})
