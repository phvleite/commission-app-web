'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { getResolvedServicePlan } from '@/lib/service-plans'
import { isValidCnpj } from '@/lib/validators/cnpj'
import { isValidCpf } from '@/lib/validators/cpf'

type UserRole = 'admin' | 'manager' | 'seller'

interface Address {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
}

interface CompanyData {
    _id: string
    name: string
    legalName: string
    slug: string
    cnpj?: string
    phoneCommercial?: string
    phoneMobile?: string
    phone?: string
    email?: string
    maxUsers: number
    effectiveMonthlyPriceCents?: number
    planCode?: string
    responsible?: {
        _id: string
        name: string
        email: string
        cpf?: string
        phone?: string
    } | null
    address?: Address
}

interface CompanyUser {
    _id: string
    name: string
    email: string
    cpf?: string
    phone?: string
    role: UserRole
    active: boolean
}

interface Props {
    userRole: UserRole
    initialCompany: CompanyData | null
    initialUsers: CompanyUser[]
}

interface CompanyFormState {
    name: string
    legalName: string
    cnpj: string
    phoneCommercial: string
    phoneMobile: string
    email: string
    responsible: {
        name: string
        email: string
        cpf: string
        phone: string
    }
    address: {
        street: string
        number: string
        neighborhood: string
        city: string
        state: string
        zipCode: string
    }
}

interface UserFormState {
    name: string
    email: string
    cpf: string
    phone: string
    password: string
    passwordConfirmation: string
    role: UserRole
}

interface UserEditFormState {
    name: string
    email: string
    cpf: string
    phone: string
    role: UserRole
}

interface PasswordChangeFormState {
    currentPassword: string
    newPassword: string
    newPasswordConfirmation: string
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
    const digits = value.replace(/\D/g, '').slice(0, 10)
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, 7)
    const second = digits.slice(7, 10)

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

function getEmptyPasswordChangeForm(): PasswordChangeFormState {
    return {
        currentPassword: '',
        newPassword: '',
        newPasswordConfirmation: '',
    }
}

function getCompanyFormFromCompany(company: CompanyData | null): CompanyFormState {
    return {
        name: company?.name ?? '',
        legalName: company?.legalName ?? '',
        cnpj: formatCnpjInput(company?.cnpj ?? ''),
        phoneCommercial: formatCommercialPhoneInput(
            company?.phoneCommercial ?? company?.phone ?? '',
        ),
        phoneMobile: formatMobilePhoneInput(company?.phoneMobile ?? ''),
        email: company?.email ?? '',
        responsible: {
            name: company?.responsible?.name ?? '',
            email: company?.responsible?.email ?? '',
            cpf: formatCpfInput(company?.responsible?.cpf ?? ''),
            phone: formatMobilePhoneInput(company?.responsible?.phone ?? ''),
        },
        address: {
            street: company?.address?.street ?? '',
            number: company?.address?.number ?? '',
            neighborhood: company?.address?.neighborhood ?? '',
            city: company?.address?.city ?? '',
            state: company?.address?.state ?? '',
            zipCode: company?.address?.zipCode ?? '',
        },
    }
}

function getEmptyUserForm(): UserFormState {
    return {
        name: '',
        email: '',
        cpf: '',
        phone: '',
        password: '',
        passwordConfirmation: '',
        role: 'seller',
    }
}

function getUserEditForm(user: CompanyUser): UserEditFormState {
    return {
        name: user.name,
        email: user.email,
        cpf: formatCpfInput(user.cpf ?? ''),
        phone: formatMobilePhoneInput(user.phone ?? ''),
        role: user.role,
    }
}

export function CompanyUsersClient({ userRole, initialCompany, initialUsers }: Props) {
    const [company, setCompany] = useState<CompanyData | null>(initialCompany)
    const [users, setUsers] = useState<CompanyUser[]>(initialUsers)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [companyForm, setCompanyForm] = useState<CompanyFormState>(
        getCompanyFormFromCompany(initialCompany),
    )
    const [isCompanyEditing, setIsCompanyEditing] = useState(false)

    const [newUser, setNewUser] = useState<UserFormState>(getEmptyUserForm())
    const [showNewUserForm, setShowNewUserForm] = useState(false)
    const [newUserEmailConflict, setNewUserEmailConflict] = useState(false)
    const [newUserPasswordMismatch, setNewUserPasswordMismatch] = useState(false)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [editUserForm, setEditUserForm] = useState<UserEditFormState | null>(null)
    const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
    const [passwordForm, setPasswordForm] = useState<PasswordChangeFormState>(
        getEmptyPasswordChangeForm(),
    )

    const canManageUsers = userRole === 'admin'
    const canEditCompany = userRole === 'admin' || userRole === 'manager'

    const totalUsers = useMemo(() => users.length, [users])
    const companyUserLimit = company?.maxUsers ?? getResolvedServicePlan().maxUsers
    const isUserLimitReached = totalUsers >= companyUserLimit

    function startCompanyEdit() {
        setError(null)
        setSuccess(null)
        setCompanyForm(getCompanyFormFromCompany(company))
        setIsCompanyEditing(true)
    }

    function cancelCompanyEdit() {
        setError(null)
        setSuccess(null)
        setCompanyForm(getCompanyFormFromCompany(company))
        setIsCompanyEditing(false)
    }

    async function handleSaveCompany(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

        if (companyForm.cnpj && !isValidCnpj(companyForm.cnpj)) {
            setError('Informe um CNPJ valido.')
            setIsSubmitting(false)
            return
        }

        if (companyForm.responsible.cpf && !isValidCpf(companyForm.responsible.cpf)) {
            setError('Informe um CPF valido para o responsavel.')
            setIsSubmitting(false)
            return
        }

        try {
            const res = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyForm),
            })

            const payload = (await res.json()) as { data?: CompanyData; error?: string }

            if (!res.ok) {
                throw new Error(payload.error ?? 'Falha ao salvar empresa.')
            }

            setCompany(payload.data ?? null)
            if (payload.data) {
                setCompanyForm(getCompanyFormFromCompany(payload.data))
            }
            setIsCompanyEditing(false)
            setSuccess('Dados da empresa atualizados com sucesso.')
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar empresa.')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(null)
        setNewUserEmailConflict(false)
        setNewUserPasswordMismatch(false)
        setIsSubmitting(true)

        if (isUserLimitReached) {
            setError(`Limite de ${companyUserLimit} usuarios atingido para esta empresa.`)
            setIsSubmitting(false)
            return
        }

        if (newUser.cpf && !isValidCpf(newUser.cpf)) {
            setError('Informe um CPF valido.')
            setIsSubmitting(false)
            return
        }

        if (!newUser.passwordConfirmation) {
            setError('Confirme a senha informada.')
            setIsSubmitting(false)
            return
        }

        if (newUser.password !== newUser.passwordConfirmation) {
            setNewUserPasswordMismatch(true)
            setError('A confirmacao de senha nao confere.')
            setIsSubmitting(false)
            return
        }

        try {
            const res = await fetch('/api/company-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            })

            const payload = (await res.json()) as { data?: CompanyUser; error?: string }

            if (!res.ok) {
                if (payload.error === 'Ja existe usuario com este email.') {
                    setNewUserEmailConflict(true)
                }
                throw new Error(payload.error ?? 'Falha ao criar usuario.')
            }

            setNewUser(getEmptyUserForm())
            setNewUserEmailConflict(false)
            setNewUserPasswordMismatch(false)
            setUsers((prev) => {
                const merged = [...prev, payload.data as CompanyUser]
                return merged.sort((a, b) => a.name.localeCompare(b.name))
            })
            setShowNewUserForm(false)
            setSuccess('Usuario criado com sucesso.')
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : 'Erro ao criar usuario.')
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleStartEditUser(user: CompanyUser) {
        setError(null)
        setSuccess(null)
        setEditingUserId(user._id)
        setEditUserForm(getUserEditForm(user))
    }

    function handleCancelEditUser() {
        setEditingUserId(null)
        setEditUserForm(null)
    }

    async function handleSaveEditUser(event: React.FormEvent<HTMLFormElement>, userId: string) {
        event.preventDefault()
        setError(null)
        setSuccess(null)

        if (!editUserForm) {
            return
        }

        setIsSubmitting(true)

        if (editUserForm.cpf && !isValidCpf(editUserForm.cpf)) {
            setError('Informe um CPF valido.')
            setIsSubmitting(false)
            return
        }

        try {
            const res = await fetch(`/api/company-users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editUserForm),
            })

            const payload = (await res.json()) as { data?: CompanyUser; error?: string }

            if (!res.ok) {
                throw new Error(payload.error ?? 'Falha ao editar usuario.')
            }

            if (payload.data) {
                const updatedUser = payload.data
                setUsers((prev) =>
                    prev
                        .map((user) => (user._id === userId ? updatedUser : user))
                        .sort((a, b) => a.name.localeCompare(b.name)),
                )
            }

            setEditingUserId(null)
            setEditUserForm(null)
            setSuccess('Usuario atualizado com sucesso.')
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : 'Erro ao editar usuario.')
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleOpenPasswordForm(userId: string) {
        setError(null)
        setSuccess(null)
        setPasswordUserId(userId)
        setPasswordForm(getEmptyPasswordChangeForm())
    }

    function handleCancelPasswordForm() {
        setPasswordUserId(null)
        setPasswordForm(getEmptyPasswordChangeForm())
    }

    async function handleSavePasswordChange(
        event: React.FormEvent<HTMLFormElement>,
        userId: string,
    ) {
        event.preventDefault()
        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

        if (
            !passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            !passwordForm.newPasswordConfirmation
        ) {
            setError('Informe senha atual, nova senha e confirmacao.')
            setIsSubmitting(false)
            return
        }

        if (passwordForm.newPassword.length < 8) {
            setError('A nova senha precisa ter no minimo 8 caracteres.')
            setIsSubmitting(false)
            return
        }

        if (passwordForm.newPassword !== passwordForm.newPasswordConfirmation) {
            setError('A confirmacao da nova senha nao confere.')
            setIsSubmitting(false)
            return
        }

        try {
            const res = await fetch(`/api/company-users/${userId}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordForm),
            })

            const payload = (await res.json()) as { error?: string }

            if (!res.ok) {
                throw new Error(payload.error ?? 'Falha ao alterar senha.')
            }

            setPasswordUserId(null)
            setPasswordForm(getEmptyPasswordChangeForm())
            setSuccess('Senha atualizada com sucesso.')
        } catch (passwordError) {
            setError(
                passwordError instanceof Error ? passwordError.message : 'Erro ao alterar senha.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleToggleUserActive(userId: string, active: boolean) {
        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

        try {
            const res = await fetch(`/api/company-users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active }),
            })

            const payload = (await res.json()) as { data?: CompanyUser; error?: string }

            if (!res.ok) {
                throw new Error(payload.error ?? 'Falha ao atualizar usuario.')
            }

            setUsers((prev) =>
                prev.map((user) =>
                    user._id === userId ? ({ ...user, active } as CompanyUser) : user,
                ),
            )
            setSuccess(active ? 'Usuario reativado.' : 'Usuario inativado com sucesso.')
        } catch (updateError) {
            setError(
                updateError instanceof Error ? updateError.message : 'Erro ao atualizar usuario.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="panel mx-auto w-full max-w-5xl p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="secondary-button inline-flex items-center gap-2 rounded-xl border border-(--color-border) px-4 py-2 text-sm font-semibold text-(--color-primary-strong) transition hover:bg-slate-100"
                >
                    <span aria-hidden="true">←</span>
                    Voltar
                </button>

                <Link
                    href="/dashboard"
                    className="primary-button inline-flex items-center rounded-xl border border-(--color-border) bg-white px-4 py-2 text-sm font-semibold text-(--color-primary-strong) transition hover:bg-slate-100"
                >
                    Ir para dashboard
                </Link>
            </div>

            <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                Configuracoes da empresa
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-(--color-primary-strong)">
                <span className="gold-bar-title block">Empresa e usuarios</span>
            </h1>
            <p className="mt-3 text-sm leading-7 text-(--color-muted)">
                Aqui voce pode atualizar os dados da empresa e gerenciar os usuarios cadastrados.
            </p>

            {error ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--color-danger)">
                    {error}
                </p>
            ) : null}

            {success ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </p>
            ) : null}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-(--color-border) bg-white/60 p-5">
                    <h2 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                        Empresa
                    </h2>
                    <p className="mt-2 text-sm text-(--color-muted)">
                        Codigo da empresa:{' '}
                        <span className="font-semibold">{company?.slug ?? '-'}</span>
                    </p>

                    {!isCompanyEditing ? (
                        <div className="mt-4">
                            <button
                                type="button"
                                className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                                onClick={startCompanyEdit}
                                disabled={!canEditCompany || isSubmitting}
                            >
                                Editar dados da empresa
                            </button>
                        </div>
                    ) : null}

                    <form className="mt-4 space-y-4" onSubmit={handleSaveCompany}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-(--color-primary-strong)">
                                Nome fantasia
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.name}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                    }))
                                }
                                required
                                disabled={!canEditCompany || !isCompanyEditing}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-(--color-primary-strong)">
                                Razao social
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.legalName}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        legalName: event.target.value,
                                    }))
                                }
                                required
                                disabled={!canEditCompany || !isCompanyEditing}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-(--color-primary-strong)">
                                CNPJ
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.cnpj}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        cnpj: formatCnpjInput(event.target.value),
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                                placeholder="00.000.000/0001-00 ou alfanumerico"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-(--color-primary-strong)">
                                Email
                            </label>
                            <input
                                type="email"
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.email}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        email: event.target.value,
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                                placeholder="contato@empresa.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-(--color-primary-strong)">
                                Telefone comercial
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.phoneCommercial}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        phoneCommercial: formatCommercialPhoneInput(
                                            event.target.value,
                                        ),
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                                placeholder="(00) 0000-0000"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-(--color-primary-strong)">
                                Telefone celular
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.phoneMobile}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        phoneMobile: formatMobilePhoneInput(event.target.value),
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                                placeholder="(00) 00000-000"
                            />
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                            <p className="text-xs font-semibold tracking-widest text-amber-800 uppercase">
                                Responsavel
                            </p>
                            <p className="mt-1 text-xs text-amber-700">
                                Este usuario sera vinculado como responsavel da empresa.
                            </p>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-amber-900">
                                        Nome
                                    </label>
                                    <input
                                        placeholder="Nome"
                                        className="h-11 w-full rounded-xl border border-amber-300 bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                                        value={companyForm.responsible.name}
                                        onChange={(event) =>
                                            setCompanyForm((prev) => ({
                                                ...prev,
                                                responsible: {
                                                    ...prev.responsible,
                                                    name: event.target.value,
                                                },
                                            }))
                                        }
                                        required
                                        disabled={!canEditCompany || !isCompanyEditing}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-amber-900">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="h-11 w-full rounded-xl border border-amber-300 bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                                        value={companyForm.responsible.email}
                                        onChange={(event) =>
                                            setCompanyForm((prev) => ({
                                                ...prev,
                                                responsible: {
                                                    ...prev.responsible,
                                                    email: event.target.value,
                                                },
                                            }))
                                        }
                                        required
                                        disabled={!canEditCompany || !isCompanyEditing}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-amber-900">
                                        CPF
                                    </label>
                                    <input
                                        placeholder="CPF"
                                        className="h-11 w-full rounded-xl border border-amber-300 bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                                        value={companyForm.responsible.cpf}
                                        onChange={(event) =>
                                            setCompanyForm((prev) => ({
                                                ...prev,
                                                responsible: {
                                                    ...prev.responsible,
                                                    cpf: formatCpfInput(event.target.value),
                                                },
                                            }))
                                        }
                                        required
                                        disabled={!canEditCompany || !isCompanyEditing}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-amber-900">
                                        Celular
                                    </label>
                                    <input
                                        placeholder="Celular"
                                        className="h-11 w-full rounded-xl border border-amber-300 bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                                        value={companyForm.responsible.phone}
                                        onChange={(event) =>
                                            setCompanyForm((prev) => ({
                                                ...prev,
                                                responsible: {
                                                    ...prev.responsible,
                                                    phone: formatMobilePhoneInput(
                                                        event.target.value,
                                                    ),
                                                },
                                            }))
                                        }
                                        required
                                        disabled={!canEditCompany || !isCompanyEditing}
                                    />
                                </div>
                            </div>

                            {company?.responsible?._id ? (
                                <div className="mt-3 border-t border-amber-200 pt-3">
                                    {passwordUserId !== company.responsible._id ? (
                                        <button
                                            type="button"
                                            className="secondary-button rounded-lg px-3 py-2 text-xs font-semibold"
                                            onClick={() =>
                                                handleOpenPasswordForm(company.responsible!._id)
                                            }
                                            disabled={isSubmitting}
                                        >
                                            Alterar senha do responsavel
                                        </button>
                                    ) : (
                                        <form
                                            className="grid gap-2"
                                            onSubmit={(event) =>
                                                handleSavePasswordChange(
                                                    event,
                                                    company.responsible!._id,
                                                )
                                            }
                                        >
                                            <label className="text-xs font-medium text-amber-900">
                                                Senha atual
                                            </label>
                                            <input
                                                type="password"
                                                aria-label="Senha atual"
                                                className="h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm"
                                                value={passwordForm.currentPassword}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        currentPassword: event.target.value,
                                                    }))
                                                }
                                                disabled={isSubmitting}
                                            />
                                            <label className="text-xs font-medium text-amber-900">
                                                Nova senha
                                            </label>
                                            <input
                                                type="password"
                                                aria-label="Nova senha"
                                                className="h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm"
                                                value={passwordForm.newPassword}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        newPassword: event.target.value,
                                                    }))
                                                }
                                                disabled={isSubmitting}
                                            />
                                            <label className="text-xs font-medium text-amber-900">
                                                Confirmacao da nova senha
                                            </label>
                                            <input
                                                type="password"
                                                aria-label="Confirmacao da nova senha"
                                                className="h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm"
                                                value={passwordForm.newPasswordConfirmation}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        newPasswordConfirmation: event.target.value,
                                                    }))
                                                }
                                                disabled={isSubmitting}
                                            />
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                <button
                                                    type="submit"
                                                    className="primary-button rounded-lg px-3 py-2 text-xs font-semibold"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting
                                                        ? 'Processando...'
                                                        : 'Salvar nova senha'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold"
                                                    onClick={handleCancelPasswordForm}
                                                    disabled={isSubmitting}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                placeholder="Rua"
                                className="h-11 rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.address.street}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        address: {
                                            ...prev.address,
                                            street: event.target.value,
                                        },
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                            />
                            <input
                                placeholder="Numero"
                                className="h-11 rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.address.number}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        address: {
                                            ...prev.address,
                                            number: event.target.value,
                                        },
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                            />
                            <input
                                placeholder="Bairro"
                                className="h-11 rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.address.neighborhood}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        address: {
                                            ...prev.address,
                                            neighborhood: event.target.value,
                                        },
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                            />
                            <input
                                placeholder="Cidade"
                                className="h-11 rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.address.city}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        address: { ...prev.address, city: event.target.value },
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                            />
                            <input
                                placeholder="UF"
                                maxLength={2}
                                className="h-11 rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.address.state}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        address: { ...prev.address, state: event.target.value },
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                            />
                            <input
                                placeholder="CEP"
                                className="h-11 rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.address.zipCode}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        address: {
                                            ...prev.address,
                                            zipCode: event.target.value,
                                        },
                                    }))
                                }
                                disabled={!canEditCompany || !isCompanyEditing}
                            />
                        </div>

                        {isCompanyEditing ? (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="submit"
                                    className="primary-button rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-70"
                                    disabled={!canEditCompany || isSubmitting}
                                >
                                    {isSubmitting ? 'Processando...' : 'Salvar alteracoes'}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-70"
                                    onClick={cancelCompanyEdit}
                                    disabled={isSubmitting}
                                >
                                    Cancelar edicao
                                </button>
                            </div>
                        ) : null}
                    </form>
                </div>

                <div className="rounded-2xl border border-(--color-border) bg-white/60 p-5">
                    <h2 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                        Usuarios
                    </h2>
                    <p className="mt-2 text-sm text-(--color-muted)">
                        Usuarios cadastrados: <span className="font-semibold">{totalUsers}</span> |
                        Limite da empresa: <span className="font-semibold">{companyUserLimit}</span>
                    </p>

                    {isUserLimitReached ? (
                        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            Limite de usuarios atingido. Ajustes de plano serao tratados na task
                            002.17.
                        </p>
                    ) : null}

                    {canManageUsers ? (
                        <button
                            type="button"
                            className={`${showNewUserForm ? 'cancel-button' : 'primary-button'} mt-4 rounded-xl px-4 py-2 text-sm font-semibold`}
                            onClick={() => {
                                setShowNewUserForm((prev) => !prev)
                                setNewUserEmailConflict(false)
                            }}
                            disabled={isSubmitting || isUserLimitReached}
                        >
                            {showNewUserForm ? 'Cancelar novo usuario' : 'Novo usuario'}
                        </button>
                    ) : null}

                    {showNewUserForm ? (
                        <form className="mt-4 space-y-3" onSubmit={handleCreateUser}>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--color-primary-strong)">
                                    Nome
                                </label>
                                <input
                                    placeholder="Nome"
                                    className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                    value={newUser.name}
                                    onChange={(event) =>
                                        setNewUser((prev) => ({
                                            ...prev,
                                            name: event.target.value,
                                        }))
                                    }
                                    required
                                    disabled={!canManageUsers}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--color-primary-strong)">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    className={`h-11 w-full rounded-xl bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition ${
                                        newUserEmailConflict
                                            ? 'border-2 border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                                            : 'border border-(--color-border) focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25'
                                    }`}
                                    value={newUser.email}
                                    onChange={(event) => {
                                        const nextEmail = event.target.value
                                        setNewUser((prev) => ({
                                            ...prev,
                                            email: nextEmail,
                                        }))

                                        if (newUserEmailConflict && nextEmail.trim()) {
                                            setNewUserEmailConflict(false)
                                        }
                                    }}
                                    required
                                    disabled={!canManageUsers}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--color-primary-strong)">
                                    CPF (opcional)
                                </label>
                                <input
                                    placeholder="CPF (opcional)"
                                    className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                    value={newUser.cpf}
                                    onChange={(event) =>
                                        setNewUser((prev) => ({
                                            ...prev,
                                            cpf: formatCpfInput(event.target.value),
                                        }))
                                    }
                                    disabled={!canManageUsers}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--color-primary-strong)">
                                    Celular (opcional)
                                </label>
                                <input
                                    placeholder="Celular (opcional)"
                                    className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                    value={newUser.phone}
                                    onChange={(event) =>
                                        setNewUser((prev) => ({
                                            ...prev,
                                            phone: formatMobilePhoneInput(event.target.value),
                                        }))
                                    }
                                    disabled={!canManageUsers}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--color-primary-strong)">
                                    Senha
                                </label>
                                <input
                                    type="password"
                                    placeholder="Senha"
                                    className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                    value={newUser.password}
                                    onChange={(event) => {
                                        const nextPassword = event.target.value
                                        setNewUser((prev) => ({
                                            ...prev,
                                            password: nextPassword,
                                        }))

                                        if (
                                            newUserPasswordMismatch &&
                                            nextPassword === newUser.passwordConfirmation
                                        ) {
                                            setNewUserPasswordMismatch(false)
                                        }
                                    }}
                                    required
                                    disabled={!canManageUsers}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--color-primary-strong)">
                                    Confirmacao da senha
                                </label>
                                <input
                                    type="password"
                                    placeholder="Confirmacao da senha"
                                    className={`h-11 w-full rounded-xl bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition ${
                                        newUserPasswordMismatch
                                            ? 'border-2 border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                                            : 'border border-(--color-border) focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25'
                                    }`}
                                    value={newUser.passwordConfirmation}
                                    onChange={(event) => {
                                        const nextPasswordConfirmation = event.target.value
                                        setNewUser((prev) => ({
                                            ...prev,
                                            passwordConfirmation: nextPasswordConfirmation,
                                        }))

                                        if (
                                            newUserPasswordMismatch &&
                                            nextPasswordConfirmation === newUser.password
                                        ) {
                                            setNewUserPasswordMismatch(false)
                                        }
                                    }}
                                    required
                                    disabled={!canManageUsers}
                                />
                            </div>
                            <select
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-surface-soft px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={newUser.role}
                                onChange={(event) =>
                                    setNewUser((prev) => ({
                                        ...prev,
                                        role: event.target.value as UserRole,
                                    }))
                                }
                                disabled={!canManageUsers}
                            >
                                <option value="seller">Seller</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>

                            <button
                                type="submit"
                                className="primary-button rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-70"
                                disabled={!canManageUsers || isSubmitting}
                            >
                                {isSubmitting ? 'Processando...' : 'Incluir usuario'}
                            </button>
                        </form>
                    ) : null}

                    <div className="mt-5 space-y-2">
                        {users.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-(--color-border) bg-surface-soft px-3 py-4 text-center text-sm text-(--color-primary-weak)">
                                Nenhum usuário cadastrado ainda.
                            </div>
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user._id}
                                    className="rounded-xl border border-(--color-border) bg-white px-3 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-(--color-primary-strong)">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-(--color-muted)">{user.email}</p>
                                        {user.cpf ? (
                                            <p className="text-xs text-(--color-muted)">
                                                CPF: {formatCpfInput(user.cpf)}
                                            </p>
                                        ) : null}
                                        {user.phone ? (
                                            <p className="text-xs text-(--color-muted)">
                                                Celular: {formatMobilePhoneInput(user.phone)}
                                            </p>
                                        ) : null}
                                        <p className="mt-1 text-xs text-(--color-muted)">
                                            Perfil: {user.role} | Status:{' '}
                                            {user.active ? 'Ativo' : 'Inativo'}
                                        </p>

                                        {canManageUsers &&
                                        editingUserId !== user._id &&
                                        passwordUserId !== user._id ? (
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="secondary-button rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-70"
                                                    onClick={() => handleStartEditUser(user)}
                                                    disabled={isSubmitting}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="secondary-button rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-70"
                                                    onClick={() => handleOpenPasswordForm(user._id)}
                                                    disabled={isSubmitting}
                                                >
                                                    Alterar senha
                                                </button>
                                                <button
                                                    type="button"
                                                    className="primary-button rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-70"
                                                    onClick={() =>
                                                        handleToggleUserActive(
                                                            user._id,
                                                            !user.active,
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting
                                                        ? 'Processando...'
                                                        : user.active
                                                          ? 'Inativar'
                                                          : 'Reativar'}
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    {editingUserId === user._id && editUserForm ? (
                                        <form
                                            className="mt-3 grid gap-2"
                                            onSubmit={(event) =>
                                                handleSaveEditUser(event, user._id)
                                            }
                                        >
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-(--color-primary-strong)">
                                                    Nome
                                                </label>
                                                <input
                                                    placeholder="Nome"
                                                    className="h-10 w-full rounded-lg border border-(--color-border) bg-surface-soft px-3 text-sm"
                                                    value={editUserForm.name}
                                                    onChange={(event) =>
                                                        setEditUserForm((prev) =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      name: event.target.value,
                                                                  }
                                                                : prev,
                                                        )
                                                    }
                                                    required
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-(--color-primary-strong)">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    className="h-10 w-full rounded-lg border border-(--color-border) bg-surface-soft px-3 text-sm"
                                                    value={editUserForm.email}
                                                    onChange={(event) =>
                                                        setEditUserForm((prev) =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      email: event.target.value,
                                                                  }
                                                                : prev,
                                                        )
                                                    }
                                                    required
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-(--color-primary-strong)">
                                                    CPF (opcional)
                                                </label>
                                                <input
                                                    placeholder="CPF (opcional)"
                                                    className="h-10 w-full rounded-lg border border-(--color-border) bg-surface-soft px-3 text-sm"
                                                    value={editUserForm.cpf}
                                                    onChange={(event) =>
                                                        setEditUserForm((prev) =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      cpf: formatCpfInput(
                                                                          event.target.value,
                                                                      ),
                                                                  }
                                                                : prev,
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-(--color-primary-strong)">
                                                    Celular (opcional)
                                                </label>
                                                <input
                                                    placeholder="Celular (opcional)"
                                                    className="h-10 w-full rounded-lg border border-(--color-border) bg-surface-soft px-3 text-sm"
                                                    value={editUserForm.phone}
                                                    onChange={(event) =>
                                                        setEditUserForm((prev) =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      phone: formatMobilePhoneInput(
                                                                          event.target.value,
                                                                      ),
                                                                  }
                                                                : prev,
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-(--color-primary-strong)">
                                                    Perfil
                                                </label>
                                                <select
                                                    className="h-10 w-full rounded-lg border border-(--color-border) bg-surface-soft px-3 text-sm"
                                                    value={editUserForm.role}
                                                    onChange={(event) =>
                                                        setEditUserForm((prev) =>
                                                            prev
                                                                ? {
                                                                      ...prev,
                                                                      role: event.target
                                                                          .value as UserRole,
                                                                  }
                                                                : prev,
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    <option value="seller">Seller</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                <button
                                                    type="submit"
                                                    className="primary-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting
                                                        ? 'Processando...'
                                                        : 'Salvar usuario'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-70"
                                                    onClick={handleCancelEditUser}
                                                    disabled={isSubmitting}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    ) : null}

                                    {passwordUserId === user._id ? (
                                        <form
                                            className="mt-3 grid gap-2"
                                            onSubmit={(event) =>
                                                handleSavePasswordChange(event, user._id)
                                            }
                                        >
                                            <label className="text-xs font-medium text-(--color-primary-strong)">
                                                Senha atual
                                            </label>
                                            <input
                                                type="password"
                                                aria-label="Senha atual"
                                                className="h-10 rounded-lg border border-(--color-border) bg-surface-soft px-3 text-sm"
                                                value={passwordForm.currentPassword}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        currentPassword: event.target.value,
                                                    }))
                                                }
                                                disabled={isSubmitting}
                                            />
                                            <label className="text-xs font-medium text-(--color-primary-strong)">
                                                Nova senha
                                            </label>
                                            <input
                                                type="password"
                                                aria-label="Nova senha"
                                                className="h-10 rounded-lg border border-(--color-border) bg-surface-soft px-3 text-sm"
                                                value={passwordForm.newPassword}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        newPassword: event.target.value,
                                                    }))
                                                }
                                                disabled={isSubmitting}
                                            />
                                            <label className="text-xs font-medium text-(--color-primary-strong)">
                                                Confirmacao da nova senha
                                            </label>
                                            <input
                                                type="password"
                                                aria-label="Confirmacao da nova senha"
                                                className="h-10 rounded-lg border border-(--color-border) bg-surface-soft px-3 text-sm"
                                                value={passwordForm.newPasswordConfirmation}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        newPasswordConfirmation: event.target.value,
                                                    }))
                                                }
                                                disabled={isSubmitting}
                                            />
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                <button
                                                    type="submit"
                                                    className="primary-button rounded-lg px-3 py-2 text-xs font-semibold"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting
                                                        ? 'Processando...'
                                                        : 'Salvar nova senha'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cancel-button rounded-lg px-3 py-2 text-xs font-semibold"
                                                    onClick={handleCancelPasswordForm}
                                                    disabled={isSubmitting}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
