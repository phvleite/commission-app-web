const signInMock = jest.fn()

jest.mock('next-auth', () => {
    class AuthError extends Error {
        type: string

        constructor(type: string) {
            super(type)
            this.type = type
        }
    }

    return { AuthError }
})

jest.mock('@/auth', () => ({
    signIn: (...args: unknown[]) => signInMock(...args),
}))

import { authenticate } from '@/app/login/actions'

const { AuthError } = jest.requireMock('next-auth') as {
    AuthError: new (type: string) => Error
}

function makeFormData(values: Record<string, string>) {
    const formData = new FormData()
    for (const [key, value] of Object.entries(values)) {
        formData.append(key, value)
    }
    return formData
}

describe('login authenticate action', () => {
    beforeEach(() => {
        signInMock.mockReset()
    })

    it('retorna erro quando faltam campos obrigatorios', async () => {
        const result = await authenticate({}, makeFormData({ email: 'teste@a.com' }))
        expect(result).toEqual({ error: 'Preencha tenant, email e senha.' })
        expect(signInMock).not.toHaveBeenCalled()
    })

    it('chama signIn com credenciais normalizadas', async () => {
        signInMock.mockResolvedValue(undefined)

        await authenticate(
            {},
            makeFormData({
                tenantSlug: ' Empresa-ABC ',
                email: ' TESTE@A.COM ',
                password: '123456',
            }),
        )

        expect(signInMock).toHaveBeenCalledWith('credentials', {
            tenantSlug: 'empresa-abc',
            email: 'teste@a.com',
            password: '123456',
            redirectTo: '/dashboard',
        })
    })

    it('retorna erro amigavel para credenciais invalidas', async () => {
        signInMock.mockRejectedValue(new AuthError('CredentialsSignin'))

        const result = await authenticate(
            {},
            makeFormData({
                tenantSlug: 'empresa-abc',
                email: 'teste@a.com',
                password: 'errada',
            }),
        )

        expect(result).toEqual({ error: 'Credenciais invalidas.' })
    })

    it('retorna erro generico para AuthError desconhecido', async () => {
        signInMock.mockRejectedValue(new AuthError('AccessDenied'))

        const result = await authenticate(
            {},
            makeFormData({
                tenantSlug: 'empresa-abc',
                email: 'teste@a.com',
                password: '123456',
            }),
        )

        expect(result).toEqual({ error: 'Nao foi possivel autenticar agora.' })
    })
})
