/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EmployeesList } from '@/app/dashboard/employees/EmployeesList'

const toastErrorMock = jest.fn()

jest.mock('sonner', () => ({
    toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}))

function renderList(overrides: Partial<React.ComponentProps<typeof EmployeesList>> = {}) {
    return render(
        <EmployeesList
            employees={[
                {
                    _id: 'emp-1',
                    name: 'Alice',
                    sectorId: 'sec-1',
                    sectorName: 'Setor A',
                    admissionDate: '2026-01-01',
                    dismissalDate: null,
                    active: true,
                },
            ]}
            sectors={[
                { _id: 'sec-1', name: 'Setor A' },
                { _id: 'sec-2', name: 'Setor B' },
            ]}
            filterStatus="all"
            filterSector="all"
            orderBy="name"
            search=""
            editingId={null}
            editName="Alice"
            editSectorId="sec-1"
            editSectorChangeDate=""
            editAdmissionDate="2026-01-01"
            editDismissalDate=""
            canWrite
            canCorrectHistory
            startEdit={jest.fn()}
            cancelEdit={jest.fn()}
            handleSaveEdition={jest.fn().mockResolvedValue(undefined)}
            setEditName={jest.fn()}
            setEditSectorId={jest.fn()}
            setEditSectorChangeDate={jest.fn()}
            setEditAdmissionDate={jest.fn()}
            setEditDismissalDate={jest.fn()}
            {...overrides}
        />,
    )
}

describe('EmployeesList sector history', () => {
    beforeEach(() => {
        toastErrorMock.mockReset()
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [
                    {
                        _id: 'history-1',
                        sectorId: 'sec-1',
                        sectorName: 'Setor A',
                        startDate: '2026-01-01T00:00:00.000Z',
                        endDate: null,
                    },
                ],
            }),
        } as Response)
    })

    afterEach(() => jest.restoreAllMocks())

    it('loads and displays the employee sector history', async () => {
        renderList()

        fireEvent.click(screen.getByRole('button', { name: 'Histórico de setores' }))

        await waitFor(() => expect(screen.getByText('01/01/2026 até atual')).toBeInTheDocument())
        expect(global.fetch).toHaveBeenCalledWith('/api/employees/emp-1/sector-history')
    })

    it('shows an immediate alert when sector changes without change date', async () => {
        const handleSaveEdition = jest.fn().mockResolvedValue(undefined)
        renderList({
            editingId: 'emp-1',
            editSectorId: 'sec-2',
            editSectorChangeDate: '',
            handleSaveEdition,
        })

        fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

        expect(toastErrorMock).toHaveBeenCalledWith('Informe a data da mudança de setor.')
        expect(handleSaveEdition).toHaveBeenCalledWith('emp-1')
    })

    it('reloads sector history after saving a sector change', async () => {
        let reloadCount = 0
        ;(global.fetch as jest.Mock).mockImplementation(async () => {
            reloadCount += 1
            return {
                ok: true,
                json: async () => ({
                    data: [
                        {
                            _id: `history-${reloadCount}`,
                            sectorId: 'sec-2',
                            sectorName: 'Setor B',
                            startDate: '2026-02-01T00:00:00.000Z',
                            endDate: null,
                        },
                    ],
                }),
            } as Response
        })

        renderList({
            editingId: 'emp-1',
            editSectorId: 'sec-2',
            editSectorChangeDate: '2026-02-01',
            handleSaveEdition: jest.fn().mockResolvedValue({ sectorChanged: true }),
        })

        fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

        await waitFor(() => expect(screen.getByText('Setor B')).toBeInTheDocument())
        expect(global.fetch).toHaveBeenCalledWith('/api/employees/emp-1/sector-history')
    })
})
