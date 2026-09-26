'use server'

import { AuthError } from 'next-auth'
import { cookies } from 'next/headers'
import { signIn } from '@/auth'
import { getInactivityCookieOptions, INACTIVITY_COOKIE_NAME } from '@/lib/auth/inactivity'

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
        const cookieStore = await cookies()
        cookieStore.set(
            INACTIVITY_COOKIE_NAME,
            String(Date.now()),
            getInactivityCookieOptions(process.env.NODE_ENV === 'production'),
        )

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
