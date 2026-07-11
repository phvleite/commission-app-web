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

    return (
        <form action={formAction} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="companyName"
                    >
                        Nome fantasia
                    </label>
                    <input
                        id="companyName"
                        name="companyName"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                        required
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="legalName"
                    >
                        Razao social
                    </label>
                    <input
                        id="legalName"
                        name="legalName"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                        required
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="tenantSlug"
                    >
                        Slug do tenant (opcional)
                    </label>
                    <input
                        id="tenantSlug"
                        name="tenantSlug"
                        placeholder="empresa-abc"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="adminName"
                    >
                        Nome do administrador
                    </label>
                    <input
                        id="adminName"
                        name="adminName"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                        required
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="adminEmail"
                    >
                        Email do administrador
                    </label>
                    <input
                        id="adminEmail"
                        name="adminEmail"
                        type="email"
                        autoComplete="email"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="password"
                    >
                        Senha
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="passwordConfirm"
                    >
                        Confirmacao de senha
                    </label>
                    <input
                        id="passwordConfirm"
                        name="passwordConfirm"
                        type="password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="street"
                    >
                        Rua
                    </label>
                    <input
                        id="street"
                        name="street"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="number"
                    >
                        Numero
                    </label>
                    <input
                        id="number"
                        name="number"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="neighborhood"
                    >
                        Bairro
                    </label>
                    <input
                        id="neighborhood"
                        name="neighborhood"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="city"
                    >
                        Cidade
                    </label>
                    <input
                        id="city"
                        name="city"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="state"
                    >
                        Estado (UF)
                    </label>
                    <input
                        id="state"
                        name="state"
                        maxLength={2}
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                    />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <label
                        className="text-sm font-medium text-[var(--color-primary-strong)]"
                        htmlFor="zipCode"
                    >
                        CEP
                    </label>
                    <input
                        id="zipCode"
                        name="zipCode"
                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-primary-strong)] outline-none transition focus:border-[var(--color-primary-soft)] focus:ring-2 focus:ring-[var(--color-primary-soft)]/25"
                    />
                </div>
            </div>

            {state.error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
                    {state.error}
                </p>
            ) : null}

            {state.success ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {state.success}
                </p>
            ) : null}

            <SubmitButton />
        </form>
    )
}
