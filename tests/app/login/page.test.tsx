/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import LoginPage from '@/app/login/page'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('@/app/login/LoginForm', () => ({
    LoginForm: () => <form aria-label="Formulário de login" />,
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}))

const authMock = auth as unknown as jest.Mock

describe('LoginPage', () => {
    beforeEach(() => {
        authMock.mockReset()
        ;(redirect as unknown as jest.Mock).mockReset()
    })

    it('offers a link back to the public home page', async () => {
        authMock.mockResolvedValue(null)

        render(await LoginPage({}))

        expect(
            screen.getByRole('link', { name: /Voltar para a página principal/i }),
        ).toHaveAttribute('href', '/')
    })

    it('renders login instead of redirecting when session expired by inactivity', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1' } })

        render(await LoginPage({ searchParams: Promise.resolve({ reason: 'inactivity' }) }))

        expect(redirect).not.toHaveBeenCalled()
        expect(screen.getByText(/Sua sessão expirou por inatividade/i)).toBeInTheDocument()
    })
})
