/** @jest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'
import { useMeritocracyClient } from '@/app/dashboard/meritocracy/MeritocracyClient'
import type {
    MeritocracyAllocationItem,
    MeritocracyEmployeeItem,
    MeritocracySectorItem,
} from '@/app/dashboard/meritocracy/MeritocracyClient'

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

const sectors: MeritocracySectorItem[] = [
    { _id: 'sec-a', name: 'Setor A' },
    { _id: 'sec-b', name: 'Setor B' },
]

const employees: MeritocracyEmployeeItem[] = [
    { _id: 'emp-1', name: 'Alice', sectorId: 'sec-a', sectorName: 'Setor A', active: true },
    { _id: 'emp-2', name: 'Bruno', sectorId: 'sec-a', sectorName: 'Setor A', active: true },
    { _id: 'emp-3', name: 'Carla', sectorId: 'sec-b', sectorName: 'Setor B', active: true },
]

const existingAllocation: MeritocracyAllocationItem = {
    _id: 'alloc-1',
    competence: '2027-05',
    periodStart: '2027-05-01T00:00:00.000Z',
    periodEnd: '2027-05-31T23:59:59.999Z',
    paymentDate: '2027-05-31T00:00:00.000Z',
    totalMeritocracyValue: 1000,
    recipientCount: 1,
    status: 'success',
    cancelReason: null,
    cancelledAt: null,
    recipients: [
        {
            employeeId: 'emp-1',
            employeeName: 'Alice',
            sectorId: 'sec-a',
            sectorName: 'Setor A',
            employeeValue: 1000,
        },
    ],
}

function setup(initialAllocations: MeritocracyAllocationItem[] = []) {
    return renderHook(() =>
        useMeritocracyClient({
            userRole: 'admin',
            initialSectors: sectors,
            initialEmployees: employees,
            initialAllocations,
        }),
    )
}

describe('useMeritocracyClient selection logic', () => {
    it('selects a sector and checks all its employees by default', () => {
        const { result } = setup()

        act(() => result.current.toggleSector('sec-a'))

        expect(result.current.isSectorFullySelected('sec-a')).toBe(true)
        expect(result.current.isSectorIndeterminate('sec-a')).toBe(false)
        expect(result.current.isEmployeeChecked(employees[0])).toBe(true)
        expect(result.current.isEmployeeChecked(employees[1])).toBe(true)
        expect(result.current.isEmployeeChecked(employees[2])).toBe(false)
    })

    it('unchecking an employee from a selected sector marks the sector as indeterminate', () => {
        const { result } = setup()

        act(() => result.current.toggleSector('sec-a'))
        act(() => result.current.toggleEmployee(employees[1]))

        expect(result.current.isEmployeeChecked(employees[1])).toBe(false)
        expect(result.current.isEmployeeChecked(employees[0])).toBe(true)
        expect(result.current.isSectorIndeterminate('sec-a')).toBe(true)
    })

    it('resets exclusions when the sector is toggled off and on again', () => {
        const { result } = setup()

        act(() => result.current.toggleSector('sec-a'))
        act(() => result.current.toggleEmployee(employees[1]))
        act(() => result.current.toggleSector('sec-a'))
        act(() => result.current.toggleSector('sec-a'))

        expect(result.current.isEmployeeChecked(employees[1])).toBe(true)
        expect(result.current.isSectorIndeterminate('sec-a')).toBe(false)
    })

    it('allows individually including an employee whose sector is not selected', () => {
        const { result } = setup()

        act(() => result.current.toggleEmployee(employees[2]))

        expect(result.current.isEmployeeChecked(employees[2])).toBe(true)
        expect(result.current.isSectorFullySelected('sec-b')).toBe(false)
    })

    it('drops a redundant individual inclusion once the employee sector gets selected', () => {
        const { result } = setup()

        act(() => result.current.toggleEmployee(employees[2]))
        act(() => result.current.toggleSector('sec-b'))
        act(() => result.current.toggleSector('sec-b'))

        expect(result.current.isEmployeeChecked(employees[2])).toBe(false)
    })

    it('derives the active allocation for the current competence', () => {
        const { result } = setup([existingAllocation])

        act(() => result.current.setCompetence('2027-05'))

        expect(result.current.existingAllocationForCompetence?._id).toBe('alloc-1')
    })
})

describe('useMeritocracyClient launchAllocation', () => {
    beforeEach(() => {
        global.fetch = jest.fn()
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('requires a competence before submitting', async () => {
        const { result } = setup()

        await act(async () => {
            await result.current.launchAllocation()
        })

        expect(result.current.error).toBe('Informe a competência (mês/ano).')
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('requires at least one selected sector or employee', async () => {
        const { result } = setup()

        act(() => result.current.setCompetence('2027-06'))

        await act(async () => {
            await result.current.launchAllocation()
        })

        expect(result.current.error).toBe('Selecione ao menos um setor ou colaborador.')
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('submits the launch and refreshes the allocations list', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockImplementation(async (_input, init) => {
            if (init?.method === 'POST') {
                return createJsonResponse({ data: existingAllocation }, 201)
            }
            return createJsonResponse({ data: [existingAllocation] })
        })

        const { result } = setup()

        act(() => {
            result.current.setCompetence('2027-05')
            result.current.toggleSector('sec-a')
        })

        await act(async () => {
            await result.current.launchAllocation()
        })

        expect(result.current.success).toBe('Meritocracia lançada com sucesso.')
        expect(result.current.selectedSectorIds).toEqual([])

        await waitFor(() => {
            expect(result.current.allocations).toHaveLength(1)
        })

        const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
        expect(postCall).toBeDefined()
        const body = JSON.parse(String(postCall?.[1]?.body))
        expect(body).toMatchObject({ competence: '2027-05', selectedSectorIds: ['sec-a'] })
    })

    it('maps ineligible employees error to a readable message', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce(
            createJsonResponse(
                {
                    error: 'Existem colaboradores selecionados que não estavam ativos.',
                    errorCode: 'INELIGIBLE_EMPLOYEES',
                    details: [{ employeeId: 'emp-1', employeeName: 'Alice' }],
                },
                400,
            ),
        )

        const { result } = setup()

        act(() => {
            result.current.setCompetence('2027-06')
            result.current.toggleSector('sec-a')
        })

        await act(async () => {
            await result.current.launchAllocation()
        })

        expect(result.current.error).toContain('Alice')
    })
})

describe('useMeritocracyClient cancelAllocation', () => {
    beforeEach(() => {
        global.fetch = jest.fn()
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('cancels an allocation and refreshes the list', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        const cancelled = { ...existingAllocation, status: 'cancelled' as const }

        fetchMock.mockImplementation(async (input, init) => {
            if (String(input).includes('/cancel')) {
                return createJsonResponse({ data: cancelled })
            }
            if (init?.method === undefined || init?.method === 'GET') {
                return createJsonResponse({ data: [cancelled] })
            }
            return createJsonResponse({ data: cancelled })
        })

        const { result } = setup([existingAllocation])

        await act(async () => {
            await result.current.cancelAllocation('alloc-1', 'Valores incorretos')
        })

        expect(result.current.success).toBe('Lançamento cancelado com sucesso.')
        await waitFor(() => {
            expect(result.current.allocations[0].status).toBe('cancelled')
        })
    })
})
