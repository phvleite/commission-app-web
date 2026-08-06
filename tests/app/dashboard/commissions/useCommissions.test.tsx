/** @jest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'
import { useCommissions } from '@/app/dashboard/commissions/hooks/useCommissions'

function createJsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (name: string) =>
                name.toLowerCase() === 'content-type' ? 'application/json' : null,
        },
        json: async () => body,
        text: async () => JSON.stringify(body),
    } as Response
}

describe('useCommissions', () => {
    beforeEach(() => {
        global.fetch = jest.fn()
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('listByPeriod returns normalized payload and toggles loading state', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce(
            createJsonResponse({
                data: [
                    {
                        date: '2026-07-01',
                        employeeName: 'Alice',
                        sectorName: 'Setor A',
                        situation: 'Apto',
                        sectorValue: 100,
                        employeeValue: 100,
                        eligibleCount: 1,
                        totalCount: 1,
                    },
                ],
                sectorSummary: [{ sectorName: 'Setor A', sectorValue: 100 }],
                salesSummary: [{ value: 1000, totalCommissionValue: 100 }],
            }),
        )

        const { result } = renderHook(() => useCommissions())

        let response: Awaited<ReturnType<typeof result.current.listByPeriod>> = null

        await act(async () => {
            response = await result.current.listByPeriod('2026-07-01', '2026-07-01')
        })

        expect(response).not.toBeNull()
        expect(response?.data).toHaveLength(1)
        expect(response?.sectorSummary).toEqual([{ sectorName: 'Setor A', sectorValue: 100 }])
        expect(response?.salesSummary).toEqual([{ value: 1000, totalCommissionValue: 100 }])
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it('listByPeriod sets error when API returns non-ok', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce(createJsonResponse({ error: 'Falha' }, 400))

        const { result } = renderHook(() => useCommissions())

        await act(async () => {
            const response = await result.current.listByPeriod('2026-07-01', '2026-07-01')
            expect(response).toBeNull()
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Falha')
    })

    it('groups, totals and filters situations consistently', async () => {
        const { result } = renderHook(() => useCommissions())

        const grouped = result.current.groupByEmployee([
            {
                date: '2026-07-01',
                employeeName: 'Bruno',
                sectorName: 'Setor B',
                situation: 'Apto',
                sectorValue: 100,
                employeeValue: 40,
                eligibleCount: 1,
                totalCount: 1,
            },
            {
                date: '2026-07-01',
                employeeName: 'Bruno',
                sectorName: 'Setor B',
                situation: 'Apto',
                sectorValue: 100,
                employeeValue: 10,
                eligibleCount: 1,
                totalCount: 1,
            },
            {
                date: '2026-07-01',
                employeeName: 'Alice',
                sectorName: 'Setor A',
                situation: 'Apto',
                sectorValue: 100,
                employeeValue: 50,
                eligibleCount: 1,
                totalCount: 1,
            },
        ])

        expect(grouped).toEqual([
            { employeeName: 'Alice', sectorName: 'Setor A', totalCommission: 50 },
            { employeeName: 'Bruno', sectorName: 'Setor B', totalCommission: 50 },
        ])

        const total = result.current.calculateTotal([
            {
                date: '2026-07-01',
                employeeName: 'Alice',
                sectorName: 'Setor A',
                situation: 'Apto',
                sectorValue: 100,
                employeeValue: 50,
                eligibleCount: 1,
                totalCount: 1,
            },
            {
                date: '2026-07-02',
                employeeName: 'Bruno',
                sectorName: 'Setor B',
                situation: 'Ferias',
                sectorValue: 100,
                employeeValue: 0,
                eligibleCount: 0,
                totalCount: 1,
            },
        ])

        expect(total).toBe(50)

        const situations = result.current.filterSituations([
            {
                date: '2026-07-02',
                employeeName: 'Bruno',
                sectorName: 'Setor B',
                totalCount: 1,
                eligibleCount: 0,
                situation: 'FERIAS',
            },
            {
                date: '2026-07-01',
                employeeName: 'Alice',
                sectorName: 'Setor A',
                totalCount: 1,
                eligibleCount: 1,
                situation: 'APTO',
            },
            {
                date: '2026-07-02',
                employeeName: 'Alice',
                sectorName: 'Setor A',
                totalCount: 1,
                eligibleCount: 0,
                situation: 'ATESTADO',
            },
        ])

        expect(situations).toHaveLength(2)
        expect(situations[0]).toMatchObject({ employeeName: 'Alice', situation: 'ATESTADO' })
        expect(situations[1]).toMatchObject({ employeeName: 'Bruno', situation: 'FERIAS' })
    })

    it('listSituations returns null and sets default error on network failure', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockRejectedValueOnce(new Error('Network down'))
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        const { result } = renderHook(() => useCommissions())

        await act(async () => {
            const response = await result.current.listSituations('2026-07-01', '2026-07-31')
            expect(response).toBeNull()
        })

        await waitFor(() => {
            expect(result.current.error).toBe('Erro ao buscar situações do período.')
        })

        consoleErrorSpy.mockRestore()
    })
})
