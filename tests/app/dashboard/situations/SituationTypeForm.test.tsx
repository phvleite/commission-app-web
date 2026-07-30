/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import SituationTypeForm from '@/app/dashboard/situations/SituationTypeForm'

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()

jest.mock('sonner', () => ({
    toast: {
        error: (...args: unknown[]) => toastErrorMock(...args),
        success: (...args: unknown[]) => toastSuccessMock(...args),
    },
}))

describe('SituationTypeForm', () => {
    beforeEach(() => {
        toastErrorMock.mockReset()
        toastSuccessMock.mockReset()
    })

    it('shows validation error for empty description', () => {
        const onSubmit = jest.fn()

        const { container } = render(<SituationTypeForm onSubmit={onSubmit} />)
        const form = container.querySelector('form')
        expect(form).not.toBeNull()
        fireEvent.submit(form!)

        expect(onSubmit).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith('Informe a descrição da situação.')
    })

    it('submits trimmed description and shows success', () => {
        const onSubmit = jest.fn()

        render(<SituationTypeForm onSubmit={onSubmit} />)

        fireEvent.change(screen.getByPlaceholderText('Ex: Férias, Folga, Atestado...'), {
            target: { value: '  Ferias  ' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

        expect(onSubmit).toHaveBeenCalledWith('Ferias')
        expect(toastSuccessMock).toHaveBeenCalledWith('Tipo de situação cadastrado!')
    })
})
