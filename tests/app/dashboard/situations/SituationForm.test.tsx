/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import SituationForm from '@/app/dashboard/situations/SituationForm'

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()

jest.mock('sonner', () => ({
    toast: {
        error: (...args: unknown[]) => toastErrorMock(...args),
        success: (...args: unknown[]) => toastSuccessMock(...args),
    },
}))

describe('SituationForm', () => {
    beforeEach(() => {
        toastErrorMock.mockReset()
        toastSuccessMock.mockReset()
    })

    it('shows error when submit has missing fields', () => {
        const onSubmit = jest.fn()
        const { container } = render(
            <SituationForm
                colaboradores={[{ _id: 'e1', name: 'Alice', active: true }]}
                tipos={[{ _id: 't1', description: 'Ferias', active: true }]}
                onSubmit={onSubmit}
            />,
        )

        const form = container.querySelector('form')
        expect(form).not.toBeNull()
        fireEvent.submit(form!)

        expect(onSubmit).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith('Preencha todos os campos.')
    })

    it('sets end date automatically when start date is later', () => {
        const onSubmit = jest.fn()
        const { container } = render(
            <SituationForm
                colaboradores={[{ _id: 'e1', name: 'Alice', active: true }]}
                tipos={[{ _id: 't1', description: 'Ferias', active: true }]}
                onSubmit={onSubmit}
            />,
        )

        const dateInputs = Array.from(
            container.querySelectorAll('input[type="date"]'),
        ) as HTMLInputElement[]
        const startInput = dateInputs[0]
        fireEvent.change(startInput, { target: { value: '2026-07-10' } })

        expect(dateInputs[1].value).toBe('2026-07-10')
    })

    it('submits valid form and resets fields', () => {
        const onSubmit = jest.fn()
        const { container } = render(
            <SituationForm
                colaboradores={[
                    { _id: 'e1', name: 'Alice', active: true },
                    { _id: 'e2', name: 'Bruno', active: false },
                ]}
                tipos={[{ _id: 't1', description: 'Ferias', active: true }]}
                onSubmit={onSubmit}
            />,
        )

        const dateInputs = Array.from(
            container.querySelectorAll('input[type="date"]'),
        ) as HTMLInputElement[]

        fireEvent.change(dateInputs[0], { target: { value: '2026-07-01' } })
        fireEvent.change(dateInputs[1], { target: { value: '2026-07-05' } })

        const selects = screen.getAllByRole('combobox')
        const collaboratorSelect = selects[0]
        const typeSelect = selects[1]

        fireEvent.change(collaboratorSelect, { target: { value: 'e1' } })
        fireEvent.change(typeSelect, { target: { value: 't1' } })

        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

        expect(onSubmit).toHaveBeenCalledWith('2026-07-01', '2026-07-05', 'e1', 't1')
        expect(toastSuccessMock).toHaveBeenCalledWith('Situação cadastrada com sucesso!')
    })
})
