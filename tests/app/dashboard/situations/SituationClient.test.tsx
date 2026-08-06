/** @jest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'
import { useSituationClient } from '@/app/dashboard/situations/SituationClient'

function createJsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        text: async () => JSON.stringify(body),
    } as Response
}

describe('useSituationClient', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        global.fetch = jest.fn()
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.resetAllMocks()
    })

    it('loads types and situations on mount', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>

        fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
            const url = String(input)
            if (url.includes('/api/situation-types')) {
                return createJsonResponse({
                    types: [{ _id: 't1', description: 'Ferias', active: true }],
                })
            }

            if (url.includes('/api/situations')) {
                return createJsonResponse({
                    situations: [
                        {
                            _id: 's1',
                            employeeId: 'e1',
                            employeeName: 'Alice',
                            typeId: 't1',
                            typeDescription: 'Ferias',
                            startDate: '2026-07-01',
                            endDate: '2026-07-10',
                            active: true,
                        },
                    ],
                })
            }

            return createJsonResponse({})
        })

        const { result } = renderHook(() =>
            useSituationClient({
                initialTypes: [],
                initialSituations: [],
                initialEmployees: [{ _id: 'e1', name: 'Alice', active: true }],
                initialSectors: [{ _id: 'sec1', name: 'Setor A', active: true }],
            }),
        )

        await act(async () => {
            jest.runOnlyPendingTimers()
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.types).toEqual([{ _id: 't1', description: 'Ferias', active: true }])
        expect(result.current.situations).toHaveLength(1)
        expect(fetchMock).toHaveBeenCalled()
    })

    it('clearFilters resets all filter fields', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValue(createJsonResponse({ types: [], situations: [] }))

        const { result } = renderHook(() =>
            useSituationClient({
                initialTypes: [],
                initialSituations: [],
                initialEmployees: [],
                initialSectors: [],
            }),
        )

        await act(async () => {
            result.current.setFilterEmployee('e1')
            result.current.setFilterType('t1')
            result.current.setFilterSector('sec1')
            result.current.setFilterStart('2026-07-01')
            result.current.setFilterEnd('2026-07-10')
            result.current.setFilterMonth('07')
            result.current.setFilterYear('2026')
        })

        await act(async () => {
            result.current.clearFilters()
        })

        expect(result.current.filterEmployee).toBe('todos')
        expect(result.current.filterType).toBe('todos')
        expect(result.current.filterSector).toBe('todos')
        expect(result.current.filterStart).toBe('')
        expect(result.current.filterEnd).toBe('')
        expect(result.current.filterMonth).toBe('')
        expect(result.current.filterYear).toBe('')
    })

    it('createSituation posts data, reloads list and sets success feedback', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>

        fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input)

            if (url.includes('/api/situation-types')) {
                return createJsonResponse({ types: [] })
            }

            if (url.startsWith('/api/situations') && init?.method === 'POST') {
                return createJsonResponse({ _id: 'new-situation' }, 200)
            }

            if (url.startsWith('/api/situations')) {
                return createJsonResponse({
                    situations: [
                        {
                            _id: 'new-situation',
                            employeeId: 'e1',
                            employeeName: 'Alice',
                            typeId: 't1',
                            typeDescription: 'Ferias',
                            startDate: '2026-07-01',
                            endDate: '2026-07-05',
                            active: true,
                        },
                    ],
                })
            }

            return createJsonResponse({})
        })

        const { result } = renderHook(() =>
            useSituationClient({
                initialTypes: [],
                initialSituations: [],
                initialEmployees: [{ _id: 'e1', name: 'Alice', active: true }],
                initialSectors: [],
            }),
        )

        await act(async () => {
            jest.runOnlyPendingTimers()
        })

        fetchMock.mockClear()

        await act(async () => {
            await result.current.createSituation('2026-07-01', '2026-07-05', 'e1', 't1')
        })

        expect(result.current.isSubmitting).toBe(false)
        expect(result.current.feedback).toEqual({
            type: 'success',
            message: 'Situação cadastrada com sucesso.',
        })
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/situations',
            expect.objectContaining({ method: 'POST' }),
        )
        expect(result.current.situations).toHaveLength(1)
    })

    it('createType surfaces API error feedback', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>

        fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input)

            if (url.includes('/api/situation-types') && init?.method === 'POST') {
                return createJsonResponse({ error: 'Descrição duplicada.' }, 400)
            }

            if (url.includes('/api/situation-types')) {
                return createJsonResponse({ types: [] })
            }

            if (url.includes('/api/situations')) {
                return createJsonResponse({ situations: [] })
            }

            return createJsonResponse({})
        })

        const { result } = renderHook(() =>
            useSituationClient({
                initialTypes: [],
                initialSituations: [],
                initialEmployees: [],
                initialSectors: [],
            }),
        )

        await act(async () => {
            jest.runOnlyPendingTimers()
        })

        await act(async () => {
            await result.current.createType('Ferias')
        })

        expect(result.current.isSubmitting).toBe(false)
        expect(result.current.feedback).toEqual({
            type: 'error',
            message: 'Descrição duplicada.',
        })
    })

    it('exportSituationsPdf envia os dados exibidos e filtros atuais', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>

        fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input)

            if (url.includes('/api/situation-types')) {
                return createJsonResponse({
                    types: [{ _id: 't1', description: 'Ferias', active: true }],
                })
            }

            if (url.includes('/api/situations') && !url.includes('/api/pdf/situations')) {
                return createJsonResponse({
                    situations: [
                        {
                            _id: 's1',
                            employeeId: 'e1',
                            employeeName: 'Alice',
                            typeId: 't1',
                            typeDescription: 'Ferias',
                            startDate: '2026-07-01',
                            endDate: '2026-07-10',
                            active: true,
                        },
                    ],
                })
            }

            if (url.includes('/api/pdf/situations') && init?.method === 'POST') {
                return {
                    ok: true,
                    status: 200,
                    blob: async () => new Blob(['fake-pdf'], { type: 'application/pdf' }),
                } as Response
            }

            return createJsonResponse({})
        })

        const createElementSpy = jest.spyOn(document, 'createElement')
        const clickMock = jest.fn()
        createElementSpy.mockImplementation(((tagName: string) => {
            const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName)
            if (tagName.toLowerCase() === 'a') {
                ;(element as HTMLAnchorElement).click = clickMock
            }
            return element
        }) as typeof document.createElement)

        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

        const originalCreateObjectURL = URL.createObjectURL
        const originalRevokeObjectURL = URL.revokeObjectURL
        URL.createObjectURL = jest.fn(() => 'blob://situations-pdf')
        URL.revokeObjectURL = jest.fn()

        const { result } = renderHook(() =>
            useSituationClient({
                initialTypes: [{ _id: 't1', description: 'Ferias', active: true }],
                initialSituations: [
                    {
                        _id: 's1',
                        employeeId: 'e1',
                        employeeName: 'Alice',
                        typeId: 't1',
                        typeDescription: 'Ferias',
                        startDate: '2026-07-01',
                        endDate: '2026-07-10',
                        active: true,
                    },
                ],
                initialEmployees: [{ _id: 'e1', name: 'Alice', active: true }],
                initialSectors: [{ _id: 'sec1', name: 'Setor A', active: true }],
                initialStartDate: '2026-07-01',
                initialEndDate: '2026-07-10',
            }),
        )

        await act(async () => {
            jest.runOnlyPendingTimers()
        })

        fetchMock.mockClear()

        await act(async () => {
            await result.current.exportSituationsPdf()
        })

        const pdfCall = fetchMock.mock.calls.find((call) =>
            String(call[0]).includes('/api/pdf/situations'),
        )
        expect(pdfCall).toBeDefined()

        const pdfRequestInit = pdfCall?.[1] as RequestInit
        const payload = JSON.parse(String(pdfRequestInit.body)) as {
            filters: {
                employee: string
                type: string
                sector: string
                startDate: string
                endDate: string
            }
            situations: Array<{ employeeName: string }>
        }

        expect(payload.filters.employee).toBe('Todos')
        expect(payload.filters.type).toBe('Todos')
        expect(payload.filters.sector).toBe('Todos')
        expect(payload.filters.startDate).toBe('2026-07-01')
        expect(payload.filters.endDate).toBe('2026-07-10')
        expect(payload.situations).toHaveLength(1)
        expect(payload.situations[0].employeeName).toBe('Alice')

        expect(openSpy).toHaveBeenCalledWith(
            'blob://situations-pdf',
            '_blank',
            'noopener,noreferrer',
        )
        expect(clickMock).toHaveBeenCalled()

        openSpy.mockRestore()
        URL.createObjectURL = originalCreateObjectURL
        URL.revokeObjectURL = originalRevokeObjectURL
        createElementSpy.mockRestore()
    })
})
