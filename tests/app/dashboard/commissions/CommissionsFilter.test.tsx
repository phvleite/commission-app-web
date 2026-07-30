/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CommissionsFilter from '@/app/dashboard/commissions/components/CommissionsFilter'
import type { CommissionsResult } from '@/app/dashboard/commissions/CommissionsClient'

const toastSuccessMock = jest.fn()
const toastWarningMock = jest.fn()

jest.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccessMock(...args),
        warning: (...args: unknown[]) => toastWarningMock(...args),
    },
}))

function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((res) => {
        resolve = res
    })
    return { promise, resolve }
}

function buildProps(overrides: Partial<React.ComponentProps<typeof CommissionsFilter>> = {}) {
    return {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        employeeId: 'emp-1',
        employees: [{ _id: 'emp-1', name: 'Alice', active: true }],
        employeesLoading: false,
        showSituations: true,
        loading: false,
        apiError: null,
        setStartDate: jest.fn(),
        setEndDate: jest.fn(),
        setEmployeeId: jest.fn(),
        setShowSituations: jest.fn(),
        onClear: jest.fn(),
        onResult: jest.fn() as React.Dispatch<React.SetStateAction<CommissionsResult>>,
        listByPeriod: jest.fn(),
        listByPeriodEmployee: jest.fn(),
        listSituations: jest.fn(),
        ...overrides,
    }
}

describe('CommissionsFilter flow', () => {
    beforeEach(() => {
        toastSuccessMock.mockReset()
        toastWarningMock.mockReset()
    })

    it('shows validation when required period is missing for general report', async () => {
        const props = buildProps({ startDate: '', endDate: '' })
        render(<CommissionsFilter {...props} />)

        fireEvent.click(screen.getByRole('button', { name: 'Gerar relatório geral' }))

        expect(await screen.findByText('Informe data inicial e final.')).toBeInTheDocument()
    })

    it('shows processing only on clicked button and emits all-report result', async () => {
        const periodDeferred = deferred<{
            data: Array<{
                date: string
                employeeName: string
                sectorName: string
                situation: string
                sectorValue: number
                employeeValue: number
                eligibleCount: number
                totalCount: number
            }>
            sectorSummary: Array<{
                sectorName: string
                sectorValue: number
                employeeValue?: number
            }>
            salesSummary: Array<{ value: number; totalCommissionValue: number }>
        }>()

        const listByPeriod = jest.fn().mockReturnValue(periodDeferred.promise)
        const listSituations = jest.fn().mockResolvedValue([])
        const onResult = jest.fn() as React.Dispatch<React.SetStateAction<CommissionsResult>>

        const props = buildProps({ listByPeriod, listSituations, onResult })
        render(<CommissionsFilter {...props} />)

        fireEvent.click(screen.getByRole('button', { name: 'Gerar relatório geral' }))

        expect(screen.getByRole('button', { name: 'Processando...' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Gerar por colaborador' })).toBeInTheDocument()

        periodDeferred.resolve({
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
        })

        await waitFor(() => {
            expect(onResult).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'all',
                    startDate: '2026-07-01',
                    endDate: '2026-07-31',
                }),
            )
        })

        expect(listSituations).toHaveBeenCalledWith('2026-07-01', '2026-07-31')
        expect(toastSuccessMock).toHaveBeenCalledWith('Relatório geral gerado.')
    })

    it('warns and clears result when employee report has no data', async () => {
        const onResult = jest.fn() as React.Dispatch<React.SetStateAction<CommissionsResult>>
        const listByPeriodEmployee = jest.fn().mockResolvedValue({
            data: [],
            sectorSummary: [],
        })

        const props = buildProps({ listByPeriodEmployee, onResult })
        render(<CommissionsFilter {...props} />)

        fireEvent.click(screen.getByRole('button', { name: 'Gerar por colaborador' }))

        await waitFor(() => {
            expect(onResult).toHaveBeenCalledWith(null)
        })

        expect(toastWarningMock).toHaveBeenCalledWith(
            'Não existem registros de comissões para o colaborador no período informado.',
        )
    })
})
