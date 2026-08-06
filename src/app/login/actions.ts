'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export interface LoginFormState {
    error?: string
}

const INITIAL_STATE: LoginFormState = {}
const PLATFORM_ADMIN_EMAIL_DOMAIN = '@commission.com.br'

export async function authenticate(
    _prevState: LoginFormState = INITIAL_STATE,
    formData: FormData,
): Promise<LoginFormState> {
    void _prevState

    const email = formData.get('email')?.toString().trim().toLowerCase()
    const password = formData.get('password')?.toString()
    const redirectTo = email?.endsWith(PLATFORM_ADMIN_EMAIL_DOMAIN)
        ? '/platform-admin'
        : '/dashboard'

    if (!email || !password) {
        return { error: 'Preencha email e senha.' }
    }

    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo,
        })

        return INITIAL_STATE
    } catch (error) {
        if (error instanceof AuthError) {
            if (error.type === 'CredentialsSignin') {
                return { error: 'Credenciais invalidas.' }
            }
            return { error: 'Nao foi possivel autenticar agora.' }
        }

        throw error
    }
}
