/** @jest-environment jsdom */

import { render, screen, waitFor } from '@testing-library/react'
import { SalesSectorsModal } from '@/app/dashboard/sales/SalesSectorModal'

jest.mock('sonner', () => ({
    toast: { error: jest.fn() },
}))

describe('SalesSectorsModal', () => {
    afterEach(() => {
        jest.restoreAllMocks()
        Reflect.deleteProperty(global, 'fetch')
    })

    it('shows the sum of all sector values', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                sectors: [
                    {
                        _id: '1',
                        sectorId: 'sector-1',
                        sectorName: 'Atendimento',
                        appliedPercentage: 60,
                        totalSectorValue: 6000,
                        totalEmployees: 3,
                        eligibleEmployees: 3,
                    },
                    {
                        _id: '2',
                        sectorId: 'sector-2',
                        sectorName: 'Cozinha',
                        appliedPercentage: 40,
                        totalSectorValue: 4000,
                        totalEmployees: 2,
                        eligibleEmployees: 2,
                    },
                ],
                totalSectorValue: 10000,
            }),
        } as Response)

        render(<SalesSectorsModal date="2026-09-20" onClose={jest.fn()} />)

        await waitFor(() => expect(screen.getByText('Atendimento')).toBeInTheDocument())
        expect(
            screen.getByText((_, element) => element?.textContent === 'R$ 100,00'),
        ).toBeInTheDocument()
    })
})
