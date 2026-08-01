/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CommissionsReportEmployee from '@/app/dashboard/commissions/components/CommissionsReportEmployee'
import type { CommissionsEmployeeResult } from '@/app/dashboard/commissions/CommissionsClient'

jest.mock('@/app/dashboard/commissions/hooks/useCommissions', () => ({
    useCommissions: () => ({
        getEmployeePeriodTitle: () => 'Relatorio da ALICE - Julho/2026',
    }),
}))

function buildResult(): CommissionsEmployeeResult {
    return {
        type: 'employee',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        data: [
            {
                date: '2026-07-02',
                employeeName: 'Alice Silva',
                sectorName: 'Setor B',
                situation: 'Apto',
                sectorValue: 5000,
                employeeValue: 2000,
                eligibleCount: 1,
                totalCount: 1,
            },
            {
                date: '2026-07-01',
                employeeName: 'Alice Silva',
                sectorName: 'Setor A',
                situation: 'Ferias',
                sectorValue: 3000,
                employeeValue: 0,
                eligibleCount: 0,
                totalCount: 1,
            },
        ],
        sectorSummary: [
            { sectorName: 'Setor A', sectorValue: 3000, employeeValue: 0 },
            { sectorName: 'Setor B', sectorValue: 5000, employeeValue: 2000 },
        ],
    }
}

describe('CommissionsReportEmployee', () => {
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

    it('renders employee report title, rows and total', () => {
        render(<CommissionsReportEmployee result={buildResult()} />)

        expect(screen.getByText('Relatorio da ALICE - Julho/2026')).toBeInTheDocument()
        expect(screen.getByText('Resumo por Setor')).toBeInTheDocument()
        expect(screen.getByText('Detalhamento das Gorjetas')).toBeInTheDocument()
        expect(screen.getByText('Total Geral: R$ 20,00')).toBeInTheDocument()
        expect(screen.getByText('01/07/2026')).toBeInTheDocument()
        expect(screen.getByText('02/07/2026')).toBeInTheDocument()
    })

    it('exports employee pdf and uses slugified filename', async () => {
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

        render(<CommissionsReportEmployee result={buildResult()} />)
        fireEvent.click(screen.getByRole('button', { name: 'Gerar PDF' }))

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                '/api/pdf/commissions/employee',
                expect.objectContaining({ method: 'POST' }),
            )
        })

        expect(window.open).toHaveBeenCalledWith('blob:mock-url', '_blank', 'noopener,noreferrer')
        expect(createdAnchor).not.toBeNull()
        expect(createdAnchor?.download).toMatch(/^relatorio-Gorjetas-alice-silva-\d{8}-\d{6}\.pdf$/)

        jest.advanceTimersByTime(60_000)
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

        jest.useRealTimers()
    })
})
