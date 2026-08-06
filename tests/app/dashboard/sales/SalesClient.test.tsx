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
        expect(result.current.sales).toEqual([])
    })
})
