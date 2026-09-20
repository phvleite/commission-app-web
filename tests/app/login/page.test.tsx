/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import LoginPage from '@/app/login/page'
import { auth } from '@/auth'

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
    it('offers a link back to the public home page', async () => {
        authMock.mockResolvedValue(null)

        render(await LoginPage())

        expect(
            screen.getByRole('link', { name: /Voltar para a página principal/i }),
        ).toHaveAttribute('href', '/')
    })
})
