'use client'

import { useState } from 'react'

export type PlatformUserRole = 'platform_owner' | 'platform_admin' | 'platform_auditor'

export interface PlatformUser {
    _id: string
    name: string
    email: string
    role: string
    platformRole: PlatformUserRole
    active: boolean
    createdAt?: string
}

interface Props {
    initialUsers: PlatformUser[]
}

interface PlatformUserFormState {
    name: string
    email: string
    password: string
    passwordConfirmation: string
    platformRole: Exclude<PlatformUserRole, 'platform_owner'>
}

interface PlatformUserEditState {
    name: string
    email: string
    platformRole: Exclude<PlatformUserRole, 'platform_owner'>
}

function getEmptyFormState(): PlatformUserFormState {
    return {
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
        platformRole: 'platform_admin',
    }
}

function getEditStateFromUser(user: PlatformUser): PlatformUserEditState {
    return {
        name: user.name,
        email: user.email,
        platformRole: user.platformRole === 'platform_owner' ? 'platform_admin' : user.platformRole,
    }
}

function getRoleLabel(role: PlatformUserRole): string {
    if (role === 'platform_owner') return 'Owner'
    if (role === 'platform_admin') return 'Admin'
    return 'Auditor'
}

export function PlatformUsersClient({ initialUsers }: Props) {
    const [users, setUsers] = useState(initialUsers)
    const [form, setForm] = useState<PlatformUserFormState>(getEmptyFormState())
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<PlatformUserEditState | null>(null)

    async function handleToggleActive(userId: string, active: boolean) {
        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/platform-admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, active }),
            })

            const payload = (await response.json()) as {
                data?: PlatformUser
                error?: string
            }

            if (!response.ok) {
                throw new Error(payload.error ?? 'Nao foi possivel atualizar o usuario.')
            }

            if (payload.data) {
                setUsers((currentUsers) =>
                    currentUsers.map((user) =>
                        user._id === payload.data?._id ? payload.data! : user,
                    ),
                )
            }

            setSuccess(active ? 'Usuario interno ativado.' : 'Usuario interno inativado.')
        } catch (toggleError) {
            setError(
                toggleError instanceof Error ? toggleError.message : 'Erro ao atualizar usuario.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    function startEditing(user: PlatformUser) {
        setError(null)
        setSuccess(null)
        setEditingUserId(user._id)
        setEditForm(getEditStateFromUser(user))
    }

    function cancelEditing() {
        setEditingUserId(null)
        setEditForm(null)
    }

    async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!editingUserId || !editForm) {
            return
        }

        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/platform-admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingUserId, ...editForm }),
            })

            const payload = (await response.json()) as {
                data?: PlatformUser
                error?: string
            }

            if (!response.ok) {
                throw new Error(payload.error ?? 'Nao foi possivel atualizar o usuario.')
            }

            if (payload.data) {
                setUsers((currentUsers) =>
                    currentUsers.map((user) =>
                        user._id === payload.data?._id ? payload.data! : user,
                    ),
                )
            }

            cancelEditing()
            setSuccess('Usuario interno atualizado com sucesso.')
        } catch (editError) {
            setError(editError instanceof Error ? editError.message : 'Erro ao atualizar usuario.')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(null)
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/platform-admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            const payload = (await response.json()) as {
                data?: PlatformUser
                error?: string
            }

            if (!response.ok) {
                throw new Error(payload.error ?? 'Nao foi possivel criar o usuario.')
            }

            if (payload.data) {
                setUsers((currentUsers) => [payload.data as PlatformUser, ...currentUsers])
            }

            setForm(getEmptyFormState())
            setSuccess('Usuario interno criado com sucesso.')
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Erro ao salvar usuario.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-(--color-border) bg-white/85 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                            Usuarios internos
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-(--color-primary-strong)">
                            Lista de acesso da plataforma
                        </h2>
                    </div>
                    <span className="rounded-full border border-(--color-border) bg-(--color-background-soft) px-3 py-1 text-xs font-semibold text-(--color-muted)">
                        {users.length} cadastrados
                    </span>
                </div>

                <div className="mt-5 space-y-3">
                    {users.map((user) => (
                        <article
                            key={user._id}
                            className="rounded-2xl border border-(--color-border) bg-(--color-background-soft) p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-(--color-primary-strong)">
                                        {user.name}
                                    </p>
                                    <p className="mt-1 text-sm text-(--color-muted)">
                                        {user.email}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full border border-(--color-border) bg-white px-3 py-1 text-(--color-primary-strong)">
                                        {getRoleLabel(user.platformRole)}
                                    </span>
                                    <span
                                        className={`rounded-full px-3 py-1 ${user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                                    >
                                        {user.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <button
                                        className="rounded-full border border-(--color-border) bg-white px-3 py-1 text-(--color-primary-strong) transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={isSubmitting}
                                        type="button"
                                        onClick={() => handleToggleActive(user._id, !user.active)}
                                    >
                                        {user.active ? 'Inativar' : 'Ativar'}
                                    </button>
                                    <button
                                        className="rounded-full border border-(--color-border) bg-white px-3 py-1 text-(--color-primary-strong) transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={isSubmitting}
                                        type="button"
                                        onClick={() => startEditing(user)}
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>

                            {editingUserId === user._id && editForm ? (
                                <form
                                    className="mt-4 grid gap-3 sm:grid-cols-3"
                                    onSubmit={handleSaveEdit}
                                >
                                    <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                                        <span>Nome</span>
                                        <input
                                            className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                                            value={editForm.name}
                                            onChange={(event) =>
                                                setEditForm({
                                                    ...editForm,
                                                    name: event.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                                        <span>Email</span>
                                        <input
                                            className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                                            type="email"
                                            value={editForm.email}
                                            onChange={(event) =>
                                                setEditForm({
                                                    ...editForm,
                                                    email: event.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                                        <span>Perfil</span>
                                        <select
                                            className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                                            value={editForm.platformRole}
                                            onChange={(event) =>
                                                setEditForm({
                                                    ...editForm,
                                                    platformRole: event.target
                                                        .value as PlatformUserEditState['platformRole'],
                                                })
                                            }
                                        >
                                            <option value="platform_admin">Administrador</option>
                                            <option value="platform_auditor">Auditor</option>
                                        </select>
                                    </label>

                                    <div className="flex flex-wrap gap-3 sm:col-span-3">
                                        <button
                                            className="primary-button rounded-xl border border-(--color-border) bg-(--color-primary) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                            disabled={isSubmitting}
                                            type="submit"
                                        >
                                            {isSubmitting ? 'Salvando...' : 'Salvar alteracoes'}
                                        </button>
                                        <button
                                            className="cancel-button rounded-xl border border-(--color-border) px-4 py-2 text-sm font-semibold"
                                            disabled={isSubmitting}
                                            type="button"
                                            onClick={cancelEditing}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            ) : null}
                        </article>
                    ))}

                    {users.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-(--color-border) bg-(--color-background-soft) p-4 text-sm text-(--color-muted)">
                            Nenhum usuario interno cadastrado ainda.
                        </p>
                    ) : null}
                </div>
            </section>

            <section className="rounded-3xl border border-(--color-border) bg-white/85 p-5 shadow-sm">
                <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                    Novo acesso
                </p>
                <h2 className="mt-2 text-xl font-semibold text-(--color-primary-strong)">
                    Criar usuario interno
                </h2>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                    <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                        <span>Nome</span>
                        <input
                            className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                            required
                        />
                    </label>

                    <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                        <span>Email</span>
                        <input
                            className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            required
                        />
                    </label>

                    <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                        <span>Perfil</span>
                        <select
                            className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                            name="platformRole"
                            value={form.platformRole}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    platformRole: event.target
                                        .value as PlatformUserFormState['platformRole'],
                                })
                            }
                        >
                            <option value="platform_admin">Administrador</option>
                            <option value="platform_auditor">Auditor</option>
                        </select>
                    </label>

                    <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                        <span>Senha</span>
                        <input
                            className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={(event) => setForm({ ...form, password: event.target.value })}
                            minLength={8}
                            required
                        />
                    </label>

                    <label className="block space-y-2 text-sm font-semibold text-(--color-primary-strong)">
                        <span>Confirmacao de senha</span>
                        <input
                            className="input-field w-full rounded-xl border border-(--color-border) px-4 py-3"
                            name="passwordConfirmation"
                            type="password"
                            value={form.passwordConfirmation}
                            onChange={(event) =>
                                setForm({ ...form, passwordConfirmation: event.target.value })
                            }
                            minLength={8}
                            required
                        />
                    </label>

                    {error ? (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </p>
                    ) : null}

                    {success ? (
                        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {success}
                        </p>
                    ) : null}

                    <button
                        className="primary-button w-full rounded-xl border border-(--color-border) bg-(--color-primary) px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? 'Salvando...' : 'Criar usuario interno'}
                    </button>
                </form>
            </section>
        </div>
    )
}
