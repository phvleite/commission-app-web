'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { registerTenantAndAdmin, type SignupFormState } from './actions'

const INITIAL_STATE: SignupFormState = {}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            className="primary-button inline-flex h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:text-base"
            type="submit"
            disabled={pending}
        >
            {pending ? 'Cadastrando...' : 'Criar empresa e admin'}
        </button>
    )
}

export function SignupForm() {
    const [state, formAction] = useActionState(registerTenantAndAdmin, INITIAL_STATE)

    const handleGoToLogin = () => {
        const loginGuide = document.getElementById('login-guide')
        if (loginGuide) {
            loginGuide.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }

    return (
        <form action={formAction} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="companyName"
                    >
                        Nome fantasia
                    </label>
                    <input
                        id="companyName"
                        name="companyName"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                        required
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="legalName"
                    >
                        Razao social
                    </label>
                    <input
                        id="legalName"
                        name="legalName"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="adminName"
                    >
                        Nome do administrador
                    </label>
                    <input
                        id="adminName"
                        name="adminName"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                        required
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="adminEmail"
                    >
                        Email do administrador
                    </label>
                    <input
                        id="adminEmail"
                        name="adminEmail"
                        type="email"
                        autoComplete="email"
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
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="passwordConfirm"
                    >
                        Confirmacao de senha
                    </label>
                    <input
                        id="passwordConfirm"
                        name="passwordConfirm"
                        type="password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="street"
                    >
                        Rua
                    </label>
                    <input
                        id="street"
                        name="street"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="number"
                    >
                        Numero
                    </label>
                    <input
                        id="number"
                        name="number"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="neighborhood"
                    >
                        Bairro
                    </label>
                    <input
                        id="neighborhood"
                        name="neighborhood"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="city"
                    >
                        Cidade
                    </label>
                    <input
                        id="city"
                        name="city"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="state"
                    >
                        Estado (UF)
                    </label>
                    <input
                        id="state"
                        name="state"
                        maxLength={2}
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-(--color-primary-strong)"
                        htmlFor="zipCode"
                    >
                        CEP
                    </label>
                    <input
                        id="zipCode"
                        name="zipCode"
                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                    />
                </div>
            </div>

            {state.error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                    {state.error}
                </p>
            ) : null}

            {state.success ? (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm text-emerald-700">{state.success}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200"
                            type="button"
                            onClick={handleGoToLogin}
                        >
                            <span aria-hidden="true">↑</span>
                            Ir para o login
                        </button>
                        {state.loginUrl ? (
                            <a
                                className="inline-flex items-center rounded-lg bg-(--color-primary) px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                                href={state.loginUrl}
                            >
                                Fazer login agora
                            </a>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <SubmitButton />
        </form>
    )
}
