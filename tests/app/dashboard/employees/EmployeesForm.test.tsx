/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { EmployeesForm } from '@/app/dashboard/employees/EmployeesForm'

describe('EmployeesForm', () => {
    it('submits form through handleCreateEmployee', () => {
        const handleCreateEmployee = jest.fn()

        render(
            <EmployeesForm
                name="Alice"
                sectorId="sec-1"
                admissionDate="2026-07-01"
                dismissalDate=""
                sectors={[{ _id: 'sec-1', name: 'Setor A' }]}
                canWrite
                setName={jest.fn()}
                setSectorId={jest.fn()}
                setAdmissionDate={jest.fn()}
                setDismissalDate={jest.fn()}
                handleCreateEmployee={handleCreateEmployee}
            />,
        )

        fireEvent.submit(screen.getByRole('button', { name: 'Cadastrar' }).closest('form')!)

        expect(handleCreateEmployee).toHaveBeenCalledTimes(1)
    })

    it('disables inputs and submit when user cannot write', () => {
        render(
            <EmployeesForm
                name=""
                sectorId=""
                admissionDate=""
                dismissalDate=""
                sectors={[{ _id: 'sec-1', name: 'Setor A' }]}
                canWrite={false}
                isSubmitting
                setName={jest.fn()}
                setSectorId={jest.fn()}
                setAdmissionDate={jest.fn()}
                setDismissalDate={jest.fn()}
                handleCreateEmployee={jest.fn()}
            />,
        )

        expect(screen.getByPlaceholderText('Ex.: João Silva')).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Processando...' })).toBeDisabled()
    })
})
