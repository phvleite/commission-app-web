'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export interface LoginFormState {
    error?: string
}

const INITIAL_STATE: LoginFormState = {}

export async function authenticate(
    _prevState: LoginFormState = INITIAL_STATE,
    formData: FormData,
): Promise<LoginFormState> {
    const tenantSlug = formData.get('tenantSlug')?.toString().trim().toLowerCase()
    const email = formData.get('email')?.toString().trim().toLowerCase()
    const password = formData.get('password')?.toString()

    if (!tenantSlug || !email || !password) {
        return { error: 'Preencha tenant, email e senha.' }
    }

    try {
        await signIn('credentials', {
            tenantSlug,
            email,
            password,
            redirectTo: '/dashboard',
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
