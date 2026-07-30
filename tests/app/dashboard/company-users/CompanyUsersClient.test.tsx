/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CompanyUsersClient } from '@/app/dashboard/company-users/CompanyUsersClient'

jest.mock('next/link', () => {
    return function LinkMock(props: {
        href: string
        className?: string
        children: React.ReactNode
    }) {
        return (
            <a href={props.href} className={props.className}>
                {props.children}
            </a>
        )
    }
})

function createJsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    } as Response
}

describe('CompanyUsersClient', () => {
    beforeEach(() => {
        global.fetch = jest.fn()
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('saves company data and shows success message', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock.mockResolvedValueOnce(
            createJsonResponse({
                data: {
                    _id: 'tenant-1',
                    name: 'Empresa Atualizada',
                    legalName: 'Empresa Atualizada LTDA',
                    slug: 'empresa-a',
                    address: {
                        street: 'Rua A',
                        number: '10',
                        neighborhood: 'Centro',
                        city: 'Sao Paulo',
                        state: 'SP',
                        zipCode: '01000-000',
                    },
                },
            }),
        )

        render(
            <CompanyUsersClient
                userRole="admin"
                initialCompany={{
                    _id: 'tenant-1',
                    name: 'Empresa A',
                    legalName: 'Empresa A LTDA',
                    slug: 'empresa-a',
                }}
                initialUsers={[]}
            />,
        )

        const companyNameInput = screen.getByDisplayValue('Empresa A')
        fireEvent.change(companyNameInput, { target: { value: 'Empresa Atualizada' } })
        fireEvent.click(screen.getByRole('button', { name: 'Salvar empresa' }))

        await waitFor(() => {
            expect(
                screen.getByText('Dados da empresa atualizados com sucesso.'),
            ).toBeInTheDocument()
        })

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/company',
            expect.objectContaining({ method: 'PATCH' }),
        )
    })

    it('creates user and toggles active status', async () => {
        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>
        fetchMock
            .mockResolvedValueOnce(
                createJsonResponse({
                    data: {
                        _id: 'u2',
                        name: 'Novo Usuario',
                        email: 'novo@company.com',
                        role: 'seller',
                        active: true,
                    },
                }),
            )
            .mockResolvedValueOnce(createJsonResponse({ data: { _id: 'u1' } }))

        render(
            <CompanyUsersClient
                userRole="admin"
                initialCompany={{
                    _id: 'tenant-1',
                    name: 'Empresa A',
                    legalName: 'Empresa A LTDA',
                    slug: 'empresa-a',
                }}
                initialUsers={[
                    {
                        _id: 'u1',
                        name: 'Alice',
                        email: 'alice@company.com',
                        role: 'seller',
                        active: true,
                    },
                ]}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Novo usuario' }))
        fireEvent.change(screen.getByPlaceholderText('Nome'), { target: { value: 'Novo Usuario' } })
        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: { value: 'novo@company.com' },
        })
        fireEvent.change(screen.getByPlaceholderText('Senha temporaria'), {
            target: { value: 'Senha@123' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Incluir usuario' }))

        await waitFor(() => {
            expect(screen.getByText('Usuario criado com sucesso.')).toBeInTheDocument()
        })

        fireEvent.click(screen.getAllByRole('button', { name: 'Inativar' })[0])

        await waitFor(() => {
            expect(screen.getByText('Usuario inativado com sucesso.')).toBeInTheDocument()
        })

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            '/api/company-users',
            expect.objectContaining({ method: 'POST' }),
        )
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            '/api/company-users/u1',
            expect.objectContaining({ method: 'PATCH' }),
        )
    })
})
