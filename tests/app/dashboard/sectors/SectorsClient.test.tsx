/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SectorsClient } from '@/app/dashboard/sectors/SectorsClient'

const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: refreshMock,
    }),
}))

function createJsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    } as Response
}

describe('SectorsClient', () => {
    beforeEach(() => {
        global.fetch = jest.fn()
        refreshMock.mockReset()
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('creates a new sector and updates UI', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce(
            createJsonResponse({
                data: {
                    _id: 'sec-2',
                    name: 'Setor B',
                    percentage: 40,
                    active: true,
                    isMeritocracia: false,
                },
            }),
        )

        render(
            <SectorsClient
                userRole="admin"
                initialSectors={[
                    {
                        _id: 'sec-1',
                        name: 'Setor A',
                        percentage: 60,
                        active: true,
                        isMeritocracia: false,
                    },
                ]}
            />,
        )

        fireEvent.change(screen.getByPlaceholderText('Nome do setor'), {
            target: { value: 'Setor B' },
        })
        fireEvent.change(screen.getByPlaceholderText('Percentual'), {
            target: { value: '40' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Adicionar setor' }))

        await waitFor(() => {
            expect(screen.getByText('Setor criado com sucesso.')).toBeInTheDocument()
        })

        expect(screen.getByText('Setor B')).toBeInTheDocument()
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/sectors',
            expect.objectContaining({ method: 'POST' }),
        )
        expect(refreshMock).toHaveBeenCalled()
    })

    it('toggles sector active state', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce(createJsonResponse({ data: { _id: 'sec-1' } }))

        render(
            <SectorsClient
                userRole="admin"
                initialSectors={[
                    {
                        _id: 'sec-1',
                        name: 'Setor A',
                        percentage: 100,
                        active: true,
                        isMeritocracia: false,
                    },
                ]}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Inativar' }))

        await waitFor(() => {
            expect(screen.getByText('Setor inativado com sucesso.')).toBeInTheDocument()
        })

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/sectors/sec-1',
            expect.objectContaining({ method: 'PATCH' }),
        )
        expect(screen.getByText('Inativo')).toBeInTheDocument()
    })
})
