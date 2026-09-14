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

        fetchMock.mockResolvedValueOnce(createJsonResponse({ sales: [] }))
        fetchMock.mockRejectedValueOnce(new Error('Falha de rede.'))

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
        fetchMock.mockResolvedValueOnce(createJsonResponse({ sales: [] }))

        const { result } = renderHook(() => useSalesClient([]))

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })

        await act(async () => {
            await expect(result.current.saveSale('2026-07-30', 100)).rejects.toThrow('Sem conexão')
        })

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(result.current.isSaving).toBe(false)
        expect(result.current.operationStatus.status).toBe('offline')
        expect(result.current.operationStatus.message).toContain('Sem conexão')
    })

    it('keeps the operation in error state when the server rejects the sale with a business error', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce(createJsonResponse({ sales: [] }))
        fetchMock.mockResolvedValueOnce(
            createJsonResponse({ error: 'Venda já cadastrada para esta data.' }, 400),
        )

        const { result } = renderHook(() => useSalesClient([]))

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1)
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
})
