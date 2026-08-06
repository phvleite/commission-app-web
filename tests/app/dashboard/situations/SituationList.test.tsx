/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import SituationList from '@/app/dashboard/situations/SituationList'

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()

jest.mock('sonner', () => ({
    toast: {
        error: (...args: unknown[]) => toastErrorMock(...args),
        success: (...args: unknown[]) => toastSuccessMock(...args),
    },
}))

describe('SituationList', () => {
    const baseProps = {
        situacoes: [
            {
                _id: 's1',
                employeeId: 'e1',
                employeeName: 'Alice',
                employeeActive: false,
                typeId: 't1',
                typeDescription: 'Ferias',
                startDate: '2026-07-01',
                endDate: '2026-07-10',
                active: true,
            },
        ],
        colaboradores: [
            { _id: 'e1', name: 'Alice' },
            { _id: 'e2', name: 'Bruno' },
        ],
        tipos: [
            { _id: 't1', description: 'Ferias', active: true },
            { _id: 't2', description: 'Folga', active: true },
        ],
        onEditar: jest.fn(),
        onAtivar: jest.fn(),
        onInativar: jest.fn(),
    }

    beforeEach(() => {
        toastErrorMock.mockReset()
        toastSuccessMock.mockReset()
        baseProps.onEditar.mockReset()
        baseProps.onAtivar.mockReset()
        baseProps.onInativar.mockReset()
    })

    it('calls onInativar for active situation', () => {
        render(<SituationList {...baseProps} />)

        expect(screen.getByText('Status do colaborador: Inativo')).toBeInTheDocument()
        expect(screen.getByText('Status da situacao: Ativa')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Inativar' }))

        expect(baseProps.onInativar).toHaveBeenCalledWith('s1')
    })

    it('validates edit form before saving', () => {
        const { container } = render(<SituationList {...baseProps} />)

        fireEvent.click(screen.getByRole('button', { name: 'Editar' }))

        const dateInputs = Array.from(
            container.querySelectorAll('input[type="date"]'),
        ) as HTMLInputElement[]

        fireEvent.change(dateInputs[0], { target: { value: '2026-07-12' } })
        fireEvent.change(dateInputs[1], { target: { value: '2026-07-10' } })

        fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

        expect(baseProps.onEditar).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith(
            'A data final não pode ser menor que a inicial.',
        )
    })

    it('saves valid inline edit', () => {
        const { container } = render(<SituationList {...baseProps} />)

        fireEvent.click(screen.getByRole('button', { name: 'Editar' }))

        const dateInputs = Array.from(
            container.querySelectorAll('input[type="date"]'),
        ) as HTMLInputElement[]

        fireEvent.change(dateInputs[0], { target: { value: '2026-07-02' } })
        fireEvent.change(dateInputs[1], { target: { value: '2026-07-11' } })

        const selects = screen.getAllByRole('combobox')

        fireEvent.change(selects[0], {
            target: { value: 'e2' },
        })
        fireEvent.change(selects[1], {
            target: { value: 't2' },
        })

        fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

        expect(baseProps.onEditar).toHaveBeenCalledWith(
            's1',
            '2026-07-02',
            '2026-07-11',
            'e2',
            't2',
        )
        expect(toastSuccessMock).toHaveBeenCalledWith('Situação atualizada!')
    })
})
