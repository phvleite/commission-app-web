/** @jest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import { EmployeesClient } from '@/app/dashboard/employees/EmployeesClient'

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

describe('EmployeesClient', () => {
    beforeEach(() => {
        global.fetch = jest.fn()
        refreshMock.mockReset()
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('blocks create when dismissal date is earlier than admission date', async () => {
        const { result } = renderHook(() =>
            EmployeesClient({
                userRole: 'admin',
                initialEmployees: [],
                initialSectors: [{ _id: 'sec-1', name: 'Setor A' }],
            }),
        )

        await act(async () => {
            result.current.setName('Alice')
            result.current.setSectorId('sec-1')
            result.current.setAdmissionDate('2026-07-10')
            result.current.setDismissalDate('2026-07-01')
        })

        await act(async () => {
            await result.current.handleCreateEmployee()
        })

        expect(result.current.error).toBe('A data de demissão não pode ser menor que a admissão.')
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('creates employee and refreshes list on success', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce(
            createJsonResponse({
                data: {
                    _id: 'emp-1',
                    name: 'Alice',
                    sectorId: 'sec-1',
                    admissionDate: '2026-07-01T00:00:00.000Z',
                    dismissalDate: null,
                    active: true,
                },
            }),
        )

        const { result } = renderHook(() =>
            EmployeesClient({
                userRole: 'admin',
                initialEmployees: [],
                initialSectors: [{ _id: 'sec-1', name: 'Setor A' }],
            }),
        )

        await act(async () => {
            result.current.setName('Alice')
            result.current.setSectorId('sec-1')
            result.current.setAdmissionDate('2026-07-01')
        })

        await act(async () => {
            await result.current.handleCreateEmployee()
        })

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/employees',
            expect.objectContaining({ method: 'POST' }),
        )
        expect(result.current.success).toBe('Colaborador criado com sucesso.')
        expect(result.current.employees).toHaveLength(1)
        expect(result.current.employees[0].sectorName).toBe('Setor A')
        expect(refreshMock).toHaveBeenCalled()
    })
})
