'use client'

import { useActionState, useState, type ChangeEvent } from 'react'
import { useFormStatus } from 'react-dom'
import {
    confirmTenantAndAdminSignup,
    registerTenantAndAdmin,
    resendSignupConfirmationCode,
    type SignupConfirmationState,
    type SignupFormState,
    type SignupResendState,
} from './actions'

const INITIAL_STATE: SignupFormState = {}

const REQUIRED_FIELDS = [
    'companyName',
    'legalName',
    'companyCnpj',
    'companyEmail',
    'adminName',
    'adminEmail',
    'adminCpf',
    'adminPhoneMobile',
    'password',
    'passwordConfirm',
] as const

type RequiredFieldName = (typeof REQUIRED_FIELDS)[number]

interface FormValues {
    companyName: string
    legalName: string
    companyCnpj: string
    companyEmail: string
    companyPhoneCommercial: string
    companyPhoneMobile: string
    adminName: string
    adminEmail: string
    adminCpf: string
    adminPhoneMobile: string
    password: string
    passwordConfirm: string
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
}

type FormFieldName = keyof FormValues

const INITIAL_FORM_VALUES: FormValues = {
    companyName: '',
    legalName: '',
    companyCnpj: '',
    companyEmail: '',
    companyPhoneCommercial: '',
    companyPhoneMobile: '',
    adminName: '',
    adminEmail: '',
    adminCpf: '',
    adminPhoneMobile: '',
    password: '',
    passwordConfirm: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
}

function isRequiredField(name: string): name is RequiredFieldName {
    return (REQUIRED_FIELDS as readonly string[]).includes(name)
}

function RequiredMark() {
    return (
        <span className="ml-1 font-semibold text-red-600" aria-hidden="true">
            *
        </span>
    )
}

function formatCpfInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    const part1 = digits.slice(0, 3)
    const part2 = digits.slice(3, 6)
    const part3 = digits.slice(6, 9)
    const part4 = digits.slice(9, 11)

    if (!part2) return part1
    if (!part3) return `${part1}.${part2}`
    if (!part4) return `${part1}.${part2}.${part3}`
    return `${part1}.${part2}.${part3}-${part4}`
}

function formatCommercialPhoneInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, 6)
    const second = digits.slice(6, 10)

    if (!ddd) return ''
    if (!first) return `(${ddd}`
    if (!second) return `(${ddd}) ${first}`
    return `(${ddd}) ${first}-${second}`
}

function formatMobilePhoneInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    const ddd = digits.slice(0, 2)
    const first = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6)
    const second = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10)

    if (!ddd) return ''
    if (!first) return `(${ddd}`
    if (!second) return `(${ddd}) ${first}`
    return `(${ddd}) ${first}-${second}`
}

function formatCnpjInput(value: string): string {
    const chars = value
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, 14)
    const p1 = chars.slice(0, 2)
    const p2 = chars.slice(2, 5)
    const p3 = chars.slice(5, 8)
    const p4 = chars.slice(8, 12)
    const p5 = chars.slice(12, 14)

    if (!p2) return p1
    if (!p3) return `${p1}.${p2}`
    if (!p4) return `${p1}.${p2}.${p3}`
    if (!p5) return `${p1}.${p2}.${p3}/${p4}`
    return `${p1}.${p2}.${p3}/${p4}-${p5}`
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            className="primary-button inline-flex h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:text-base"
            type="submit"
            disabled={pending}
        >
            {pending ? 'Enviando código...' : 'Enviar código de confirmação'}
        </button>
    )
}

export function SignupForm() {
    const [state, formAction] = useActionState(registerTenantAndAdmin, INITIAL_STATE)
    const [confirmationState, confirmFormAction] = useActionState(
        confirmTenantAndAdminSignup,
        {} as SignupConfirmationState,
    )
    const [resendState, resendFormAction] = useActionState(
        resendSignupConfirmationCode,
        {} as SignupResendState,
    )
    const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_VALUES)
    const [clientError, setClientError] = useState<string | null>(null)
    const [missingRequiredFields, setMissingRequiredFields] = useState<Set<RequiredFieldName>>(
        new Set(),
    )
    const [passwordMismatch, setPasswordMismatch] = useState(false)
    const [verificationCode, setVerificationCode] = useState('')
    const [verificationEmailInput, setVerificationEmailInput] = useState('')

    const verificationEmailFromState = state.verificationEmail ?? ''
    const verificationEmailResolved =
        verificationEmailInput || resendState.verificationEmail || verificationEmailFromState
    const emailSyncNotice =
        resendState.verificationEmail && resendState.verificationEmail !== formValues.adminEmail
            ? `Atualizamos o e-mail do administrador no cadastro para ${resendState.verificationEmail}.`
            : null

    const verificationCodeInputClass = `h-12 w-full rounded-xl bg-white px-3 text-center text-base font-semibold tracking-[0.35em] text-(--color-primary-strong) outline-none transition ${
        confirmationState.error
            ? 'border-2 border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-200'
            : confirmationState.success
              ? 'border-2 border-emerald-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200'
              : 'border border-(--color-border) focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25'
    }`

    const serverInvalidFields = new Set<RequiredFieldName>()
    if (state.error?.includes('CNPJ valido')) {
        serverInvalidFields.add('companyCnpj')
    }
    if (state.error?.includes('Ja existe empresa com este CNPJ')) {
        serverInvalidFields.add('companyCnpj')
    }
    if (state.error?.includes('CPF valido')) {
        serverInvalidFields.add('adminCpf')
    }
    if (state.error?.includes('Ja existe usuario com este email')) {
        serverInvalidFields.add('adminEmail')
    }

    function getRequiredInputClass(fieldName: RequiredFieldName): string {
        const highlighted =
            missingRequiredFields.has(fieldName) || serverInvalidFields.has(fieldName)

        return `h-11 w-full rounded-xl bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition ${
            highlighted
                ? 'border-2 border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                : 'border border-(--color-border) focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25'
        }`
    }

    function getOptionalInputClass(fieldName: FormFieldName): string {
        const highlighted = serverInvalidFields.has(fieldName as RequiredFieldName)

        return `h-11 w-full rounded-xl bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition ${
            highlighted
                ? 'border-2 border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                : 'border border-(--color-border) focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25'
        }`
    }

    function getPasswordConfirmClass(): string {
        const highlighted = passwordMismatch || serverInvalidFields.has('passwordConfirm')

        return `h-11 w-full rounded-xl bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition ${
            highlighted
                ? 'border-2 border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                : 'border border-(--color-border) focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25'
        }`
    }

    function handleRequiredValidation(event: React.FormEvent<HTMLFormElement>) {
        const formData = new FormData(event.currentTarget)
        const missing = REQUIRED_FIELDS.filter((fieldName) => {
            const value = formData.get(fieldName)?.toString().trim()
            return !value
        })

        if (missing.length > 0) {
            event.preventDefault()
            setMissingRequiredFields(new Set(missing))
            setClientError('Preencha todos os campos obrigatórios.')
            return
        }

        if (formValues.password !== formValues.passwordConfirm) {
            event.preventDefault()
            setPasswordMismatch(true)
            setClientError('A confirmação de senha não confere.')
            return
        }

        setMissingRequiredFields(new Set())
        setClientError(null)
        setPasswordMismatch(false)
        setVerificationCode('')
        setVerificationEmailInput(formValues.adminEmail.trim())
    }

    function handleRequiredInput(event: React.FormEvent<HTMLFormElement>) {
        const target = event.target

        if (!(target instanceof HTMLInputElement)) {
            return
        }

        if (!isRequiredField(target.name)) {
            return
        }

        const fieldName = target.name
        const value = target.value.trim()

        if (!value) {
            return
        }

        setMissingRequiredFields((previous) => {
            if (!previous.has(fieldName)) {
                return previous
            }

            const next = new Set(previous)
            next.delete(fieldName)

            if (next.size === 0) {
                setClientError(null)
            }

            return next
        })
    }

    function handleFieldChange(fieldName: FormFieldName) {
        return (event: ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value
            setFormValues((previous) => ({
                ...previous,
                [fieldName]: nextValue,
            }))

            if (
                passwordMismatch &&
                ((fieldName === 'password' && nextValue === formValues.passwordConfirm) ||
                    (fieldName === 'passwordConfirm' && nextValue === formValues.password))
            ) {
                setPasswordMismatch(false)
            }
        }
    }

    function handleCpfChange(event: ChangeEvent<HTMLInputElement>) {
        setFormValues((previous) => ({
            ...previous,
            adminCpf: formatCpfInput(event.target.value),
        }))
    }

    function handleCnpjChange(event: ChangeEvent<HTMLInputElement>) {
        setFormValues((previous) => ({
            ...previous,
            companyCnpj: formatCnpjInput(event.target.value),
        }))
    }

    function handleCommercialPhoneChange(event: ChangeEvent<HTMLInputElement>) {
        setFormValues((previous) => ({
            ...previous,
            companyPhoneCommercial: formatCommercialPhoneInput(event.target.value),
        }))
    }

    function handleCompanyMobilePhoneChange(event: ChangeEvent<HTMLInputElement>) {
        setFormValues((previous) => ({
            ...previous,
            companyPhoneMobile: formatMobilePhoneInput(event.target.value),
        }))
    }
    function handleMobilePhoneChange(event: ChangeEvent<HTMLInputElement>) {
        setFormValues((previous) => ({
            ...previous,
            adminPhoneMobile: formatMobilePhoneInput(event.target.value),
        }))
    }

    return (
        <>
            <form
                action={formAction}
                className="space-y-5"
                noValidate
                onSubmit={handleRequiredValidation}
                onInput={handleRequiredInput}
            >
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span className="font-semibold text-red-600">*</span> Campos obrigatórios.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="companyName"
                        >
                            Nome fantasia
                            <RequiredMark />
                        </label>
                        <input
                            id="companyName"
                            name="companyName"
                            className={getRequiredInputClass('companyName')}
                            value={formValues.companyName}
                            onChange={handleFieldChange('companyName')}
                            required
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="legalName"
                        >
                            Razão social
                            <RequiredMark />
                        </label>
                        <input
                            id="legalName"
                            name="legalName"
                            className={getRequiredInputClass('legalName')}
                            value={formValues.legalName}
                            onChange={handleFieldChange('legalName')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="companyCnpj"
                        >
                            CNPJ
                            <RequiredMark />
                        </label>
                        <input
                            id="companyCnpj"
                            name="companyCnpj"
                            className={getRequiredInputClass('companyCnpj')}
                            value={formValues.companyCnpj}
                            required
                            onChange={handleCnpjChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="companyEmail"
                        >
                            E-mail da empresa
                            <RequiredMark />
                        </label>
                        <input
                            id="companyEmail"
                            name="companyEmail"
                            type="email"
                            autoComplete="email"
                            className={getRequiredInputClass('companyEmail')}
                            value={formValues.companyEmail}
                            onChange={handleFieldChange('companyEmail')}
                            required
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="companyPhoneCommercial"
                        >
                            Telefone fixo da empresa
                        </label>
                        <input
                            id="companyPhoneCommercial"
                            name="companyPhoneCommercial"
                            className={getOptionalInputClass('companyPhoneCommercial')}
                            value={formValues.companyPhoneCommercial}
                            onChange={handleCommercialPhoneChange}
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="companyPhoneMobile"
                        >
                            Celular da empresa
                        </label>
                        <input
                            id="companyPhoneMobile"
                            name="companyPhoneMobile"
                            className={getOptionalInputClass('companyPhoneMobile')}
                            value={formValues.companyPhoneMobile}
                            onChange={handleCompanyMobilePhoneChange}
                        />
                    </div>
                </div>

                <fieldset className="grid gap-4 rounded-2xl border border-(--color-border) bg-white/50 p-4 sm:grid-cols-2">
                    <legend className="px-2 text-sm font-semibold text-(--color-primary-strong)">
                        Administrador
                    </legend>

                    <div className="space-y-2 sm:col-span-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="adminName"
                        >
                            Nome
                            <RequiredMark />
                        </label>
                        <input
                            id="adminName"
                            name="adminName"
                            className={getRequiredInputClass('adminName')}
                            value={formValues.adminName}
                            onChange={handleFieldChange('adminName')}
                            required
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="adminEmail"
                        >
                            E-mail
                            <RequiredMark />
                        </label>
                        <input
                            id="adminEmail"
                            name="adminEmail"
                            type="email"
                            autoComplete="email"
                            className={getRequiredInputClass('adminEmail')}
                            value={formValues.adminEmail}
                            onChange={handleFieldChange('adminEmail')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="adminCpf"
                        >
                            CPF
                            <RequiredMark />
                        </label>
                        <input
                            id="adminCpf"
                            name="adminCpf"
                            className={getRequiredInputClass('adminCpf')}
                            value={formValues.adminCpf}
                            required
                            onChange={handleCpfChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="adminPhoneMobile"
                        >
                            Celular
                            <RequiredMark />
                        </label>
                        <input
                            id="adminPhoneMobile"
                            name="adminPhoneMobile"
                            className={getRequiredInputClass('adminPhoneMobile')}
                            value={formValues.adminPhoneMobile}
                            required
                            onChange={handleMobilePhoneChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="password"
                        >
                            Senha
                            <RequiredMark />
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Mínimo 8 caracteres"
                            minLength={8}
                            className={getRequiredInputClass('password')}
                            value={formValues.password}
                            onChange={handleFieldChange('password')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="passwordConfirm"
                        >
                            Confirmação da senha
                            <RequiredMark />
                        </label>
                        <input
                            id="passwordConfirm"
                            name="passwordConfirm"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repita a senha (mínimo 8 caracteres)"
                            minLength={8}
                            className={getPasswordConfirmClass()}
                            value={formValues.passwordConfirm}
                            onChange={handleFieldChange('passwordConfirm')}
                            required
                        />
                    </div>
                </fieldset>

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
                            className={getOptionalInputClass('street')}
                            value={formValues.street}
                            onChange={handleFieldChange('street')}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium text-(--color-primary-strong)"
                            htmlFor="number"
                        >
                            Número
                        </label>
                        <input
                            id="number"
                            name="number"
                            className={getOptionalInputClass('number')}
                            value={formValues.number}
                            onChange={handleFieldChange('number')}
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
                            className={getOptionalInputClass('neighborhood')}
                            value={formValues.neighborhood}
                            onChange={handleFieldChange('neighborhood')}
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
                            className={getOptionalInputClass('city')}
                            value={formValues.city}
                            onChange={handleFieldChange('city')}
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
                            className={getOptionalInputClass('state')}
                            value={formValues.state}
                            onChange={handleFieldChange('state')}
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
                            className={getOptionalInputClass('zipCode')}
                            value={formValues.zipCode}
                            onChange={handleFieldChange('zipCode')}
                        />
                    </div>
                </div>

                {clientError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                        {clientError}
                    </p>
                ) : null}

                {state.error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                        {state.error}
                    </p>
                ) : null}

                {state.success ? (
                    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-sm text-emerald-700">{state.success}</p>
                        {state.verificationEmail ? (
                            <p className="text-sm text-emerald-700">
                                Enviamos o código para {state.verificationEmail}.
                            </p>
                        ) : null}
                    </div>
                ) : null}

                <SubmitButton />
            </form>

            {state.verificationPending ? (
                <section className="mt-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-amber-950">
                            Confirme o cadastro com o código enviado por e-mail
                        </p>
                        <p className="text-sm text-amber-900">
                            Digite o código recebido em{' '}
                            {verificationEmailResolved || 'seu e-mail informado'} para finalizar o
                            cadastro.
                        </p>
                        <p className="text-xs text-amber-900/90">
                            Não encontrou a mensagem? Verifique também a lixeira eletrônica e a
                            pasta de spam.
                        </p>
                    </div>

                    {confirmationState.success ? (
                        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <div className="mx-auto w-full max-w-xs">
                                <input
                                    className={verificationCodeInputClass}
                                    value={verificationCode}
                                    readOnly
                                    aria-label="Código de confirmação validado"
                                />
                            </div>
                            <p className="text-sm text-emerald-700">{confirmationState.success}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {confirmationState.loginUrl ? (
                                    <a
                                        className="primary-button inline-flex items-center rounded-lg border border-(--color-primary-strong) bg-(--color-primary-strong) px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                                        href={confirmationState.loginUrl}
                                    >
                                        Fazer login agora
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <>
                            <form className="space-y-3" action={confirmFormAction}>
                                <input
                                    type="hidden"
                                    name="signupRequestId"
                                    value={state.signupRequestId ?? ''}
                                />

                                <label className="block space-y-2 text-sm font-medium text-(--color-primary-strong)">
                                    <span className="block text-center">Código de confirmação</span>
                                    <div className="mx-auto w-full max-w-xs">
                                        <input
                                            className={verificationCodeInputClass}
                                            name="verificationCode"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(event) =>
                                                setVerificationCode(event.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </label>

                                {confirmationState.error ? (
                                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                                        {confirmationState.error}
                                    </p>
                                ) : null}

                                <button
                                    className="primary-button inline-flex h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:text-base"
                                    type="submit"
                                >
                                    Confirmar e concluir cadastro
                                </button>
                            </form>

                            <div className="my-2 h-px bg-amber-200" />

                            <form className="space-y-3" action={resendFormAction}>
                                <input
                                    type="hidden"
                                    name="signupRequestId"
                                    value={state.signupRequestId ?? ''}
                                />

                                <label className="block space-y-2 text-sm font-medium text-(--color-primary-strong)">
                                    <span>Corrigir e-mail para reenvio do código</span>
                                    <input
                                        className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                        name="adminEmail"
                                        type="email"
                                        autoComplete="email"
                                        value={verificationEmailResolved}
                                        onChange={(event) =>
                                            setVerificationEmailInput(event.target.value)
                                        }
                                        required
                                    />
                                </label>

                                {resendState.error ? (
                                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                                        {resendState.error}
                                    </p>
                                ) : null}

                                {resendState.success ? (
                                    <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {resendState.success}
                                    </p>
                                ) : null}

                                {emailSyncNotice ? (
                                    <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                                        {emailSyncNotice}
                                    </p>
                                ) : null}

                                <button
                                    className="secondary-button inline-flex h-11 w-full items-center justify-center rounded-xl border border-(--color-border) px-5 py-2 text-sm font-semibold"
                                    type="submit"
                                >
                                    Reenviar código
                                </button>
                            </form>
                        </>
                    )}
                </section>
            ) : null}
        </>
    )
}
