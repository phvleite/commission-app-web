'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

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
    address?: Address
}

interface CompanyUser {
    _id: string
    name: string
    email: string
    role: UserRole
    active: boolean
}

interface Props {
    userRole: UserRole
    initialCompany: CompanyData | null
    initialUsers: CompanyUser[]
}

export function CompanyUsersClient({ userRole, initialCompany, initialUsers }: Props) {
    const [company, setCompany] = useState<CompanyData | null>(initialCompany)
    const [users, setUsers] = useState<CompanyUser[]>(initialUsers)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [companyForm, setCompanyForm] = useState({
        name: initialCompany?.name ?? '',
        legalName: initialCompany?.legalName ?? '',
        address: {
            street: initialCompany?.address?.street ?? '',
            number: initialCompany?.address?.number ?? '',
            neighborhood: initialCompany?.address?.neighborhood ?? '',
            city: initialCompany?.address?.city ?? '',
            state: initialCompany?.address?.state ?? '',
            zipCode: initialCompany?.address?.zipCode ?? '',
        },
    })

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'seller' as UserRole,
    })
    const [showNewUserForm, setShowNewUserForm] = useState(false)

    const canManageUsers = userRole === 'admin'
    const canEditCompany = userRole === 'admin' || userRole === 'manager'

    const totalActiveUsers = useMemo(() => users.filter((user) => user.active).length, [users])

    async function handleSaveCompany(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(null)

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
            setSuccess('Dados da empresa atualizados com sucesso.')
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar empresa.')
        }
    }

    async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch('/api/company-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            })

            const payload = (await res.json()) as { data?: CompanyUser; error?: string }

            if (!res.ok) {
                throw new Error(payload.error ?? 'Falha ao criar usuario.')
            }

            setNewUser({ name: '', email: '', password: '', role: 'seller' })
            setUsers((prev) => {
                const merged = [...prev, payload.data as CompanyUser]
                return merged.sort((a, b) => a.name.localeCompare(b.name))
            })
            setShowNewUserForm(false)
            setSuccess('Usuario criado com sucesso.')
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : 'Erro ao criar usuario.')
        }
    }

    async function handleToggleUserActive(userId: string, active: boolean) {
        setError(null)
        setSuccess(null)

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
        }
    }

    return (
        <section className="panel mx-auto w-full max-w-5xl p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-white px-4 py-2 text-sm font-semibold text-(--color-primary-strong) transition hover:bg-slate-100"
                >
                    <span aria-hidden="true">←</span>
                    Voltar
                </button>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-xl border border-(--color-border) bg-white px-4 py-2 text-sm font-semibold text-(--color-primary-strong) transition hover:bg-slate-100"
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

                    <form className="mt-4 space-y-4" onSubmit={handleSaveCompany}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-(--color-primary-strong)">
                                Nome fantasia
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.name}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                    }))
                                }
                                required
                                disabled={!canEditCompany}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-(--color-primary-strong)">
                                Razao social
                            </label>
                            <input
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.legalName}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        legalName: event.target.value,
                                    }))
                                }
                                required
                                disabled={!canEditCompany}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                placeholder="Rua"
                                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
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
                                disabled={!canEditCompany}
                            />
                            <input
                                placeholder="Numero"
                                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
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
                                disabled={!canEditCompany}
                            />
                            <input
                                placeholder="Bairro"
                                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
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
                                disabled={!canEditCompany}
                            />
                            <input
                                placeholder="Cidade"
                                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.address.city}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        address: { ...prev.address, city: event.target.value },
                                    }))
                                }
                                disabled={!canEditCompany}
                            />
                            <input
                                placeholder="UF"
                                maxLength={2}
                                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={companyForm.address.state}
                                onChange={(event) =>
                                    setCompanyForm((prev) => ({
                                        ...prev,
                                        address: { ...prev.address, state: event.target.value },
                                    }))
                                }
                                disabled={!canEditCompany}
                            />
                            <input
                                placeholder="CEP"
                                className="h-11 rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
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
                                disabled={!canEditCompany}
                            />
                        </div>

                        <button
                            type="submit"
                            className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                            disabled={!canEditCompany}
                        >
                            Salvar empresa
                        </button>
                    </form>
                </div>

                <div className="rounded-2xl border border-(--color-border) bg-white/60 p-5">
                    <h2 className="gold-bar-title text-xl font-semibold text-(--color-primary-strong)">
                        Usuarios
                    </h2>
                    <p className="mt-2 text-sm text-(--color-muted)">
                        Usuarios ativos: <span className="font-semibold">{totalActiveUsers}</span> |
                        Limite do pacote basico: <span className="font-semibold">2</span>
                    </p>

                    {canManageUsers ? (
                        <button
                            type="button"
                            className={`${showNewUserForm ? 'cancel-button' : 'primary-button'} mt-4 rounded-xl px-4 py-2 text-sm font-semibold`}
                            onClick={() => setShowNewUserForm((prev) => !prev)}
                        >
                            {showNewUserForm ? 'Cancelar novo usuario' : 'Novo usuario'}
                        </button>
                    ) : null}

                    {showNewUserForm ? (
                        <form className="mt-4 space-y-3" onSubmit={handleCreateUser}>
                            <input
                                placeholder="Nome"
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={newUser.name}
                                onChange={(event) =>
                                    setNewUser((prev) => ({ ...prev, name: event.target.value }))
                                }
                                required
                                disabled={!canManageUsers}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={newUser.email}
                                onChange={(event) =>
                                    setNewUser((prev) => ({ ...prev, email: event.target.value }))
                                }
                                required
                                disabled={!canManageUsers}
                            />
                            <input
                                type="password"
                                placeholder="Senha temporaria"
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
                                value={newUser.password}
                                onChange={(event) =>
                                    setNewUser((prev) => ({
                                        ...prev,
                                        password: event.target.value,
                                    }))
                                }
                                required
                                disabled={!canManageUsers}
                            />
                            <select
                                className="h-11 w-full rounded-xl border border-(--color-border) bg-white px-3 text-sm text-(--color-primary-strong) outline-none transition focus:border-(--color-primary-soft) focus:ring-2 focus:ring-primary-soft/25"
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
                                className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                                disabled={!canManageUsers}
                            >
                                Incluir usuario
                            </button>
                        </form>
                    ) : null}

                    <div className="mt-5 space-y-2">
                        {users.map((user) => (
                            <div
                                key={user._id}
                                className="rounded-xl border border-(--color-border) bg-white px-3 py-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-(--color-primary-strong)">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-(--color-muted)">{user.email}</p>
                                        <p className="mt-1 text-xs text-(--color-muted)">
                                            Perfil: {user.role} | Status:{' '}
                                            {user.active ? 'Ativo' : 'Inativo'}
                                        </p>
                                    </div>

                                    {canManageUsers ? (
                                        <button
                                            type="button"
                                            className="primary-button rounded-lg px-2 py-1 text-xs font-semibold"
                                            onClick={() =>
                                                handleToggleUserActive(user._id, !user.active)
                                            }
                                        >
                                            {user.active ? 'Inativar' : 'Reativar'}
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
