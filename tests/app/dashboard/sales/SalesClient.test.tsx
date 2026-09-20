/** @jest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'

const toastErrorMock = jest.fn()

jest.mock('sonner', () => ({
    toast: {
        error: (...args: unknown[]) => toastErrorMock(...args),
    },
}))

import { useSalesClient } from '@/app/dashboard/sales/SalesClient'

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

describe('useSalesClient', () => {
    beforeEach(() => {
        toastErrorMock.mockReset()
        global.fetch = jest.fn()
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            value: true,
        })
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('clears the saving state when the sale request fails due to network loss', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>

        fetchMock.mockImplementation(async (input, init) => {
            const url = String(input)
            if (url.includes('/api/sales/pending')) {
                return createJsonResponse({ pending: null })
            }
            if (init?.method === 'POST') {
                throw new Error('Falha de rede.')
            }
            return createJsonResponse({ sales: [] })
        })

        const { result } = renderHook(() => useSalesClient([]))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        await act(async () => {
            await expect(result.current.saveSale('2026-07-30', 100)).rejects.toThrow(
                'Falha de rede.',
            )
        })

        expect(result.current.isSaving).toBe(false)
        expect(result.current.operationStatus.status).toBe('offline')
        expect(result.current.operationStatus.message).toContain('Sem conexão')
        expect(result.current.sales).toEqual([])
    })

    it('marks the operation as offline when the browser has no connection before saving', async () => {
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            value: false,
        })

        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockImplementation(async (input) =>
            String(input).includes('/api/sales/pending')
                ? createJsonResponse({ pending: null })
                : createJsonResponse({ sales: [] }),
        )

        const { result } = renderHook(() => useSalesClient([]))

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        await act(async () => {
            await expect(result.current.saveSale('2026-07-30', 100)).rejects.toThrow('Sem conexão')
        })

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(result.current.isSaving).toBe(false)
        expect(result.current.operationStatus.status).toBe('offline')
        expect(result.current.operationStatus.message).toContain('Sem conexão')
    })

    it('keeps the operation in error state when the server rejects the sale with a business error', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockImplementation(async (input, init) => {
            if (String(input).includes('/api/sales/pending')) {
                return createJsonResponse({ pending: null })
            }
            if (init?.method === 'POST') {
                return createJsonResponse({ error: 'Venda já cadastrada para esta data.' }, 400)
            }
            return createJsonResponse({ sales: [] })
        })

        const { result } = renderHook(() => useSalesClient([]))

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        await act(async () => {
            await expect(result.current.saveSale('2026-07-30', 100)).rejects.toThrow(
                'Venda já cadastrada para esta data.',
            )
        })

        expect(result.current.isSaving).toBe(false)
        expect(result.current.operationStatus.status).toBe('error')
        expect(result.current.operationStatus.message).toContain('Venda já cadastrada')
    })

    it('loads and discards an abandoned pending sale', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        let hasPending = true

        fetchMock.mockImplementation(async (input, init) => {
            const url = String(input)
            if (url.includes('/api/sales/pending') && init?.method === 'POST') {
                hasPending = false
                return createJsonResponse({ ok: true })
            }
            if (url.includes('/api/sales/pending')) {
                return createJsonResponse({
                    pending: hasPending
                        ? {
                              date: '2026-07-30T00:00:00.000Z',
                              value: 10000,
                              totalCommissionValue: 1000,
                              status: 'network_lost',
                              startedAt: '2026-07-30T00:00:01.000Z',
                              recoverable: true,
                          }
                        : null,
                })
            }
            return createJsonResponse({ sales: [] })
        })

        const { result } = renderHook(() => useSalesClient([]))

        await waitFor(() => expect(result.current.pendingSale).not.toBeNull())

        await act(async () => {
            await result.current.resolvePendingSale('discard')
        })

        expect(result.current.pendingSale).toBeNull()
        expect(result.current.operationStatus.message).toContain('desconsiderado')
    })
})
