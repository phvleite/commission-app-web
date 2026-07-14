'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate, type LoginFormState } from './actions'

const INITIAL_STATE: LoginFormState = {}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            className="primary-button inline-flex h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:text-base"
            type="submit"
            disabled={pending}
        >
            {pending ? 'Entrando...' : 'Entrar'}
        </button>
    )
}

export function LoginForm() {
    const [state, formAction] = useActionState(authenticate, INITIAL_STATE)

    return (
        <form action={formAction} className="space-y-5" noValidate>
            <div className="space-y-2">
                <label
                    className="text-sm font-medium text-(--color-primary-strong)"
                    htmlFor="email"
                >
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@empresa.com"
                    className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    required
                />
            </div>

            <div className="space-y-2">
                <label
                    className="text-sm font-medium text-(--color-primary-strong)"
                    htmlFor="password"
                >
                    Senha
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="********"
                    className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    required
                />
            </div>

            {state.error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                    {state.error}
                </p>
            ) : null}

            <SubmitButton />
        </form>
    )
}
