'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface Props {
    userName?: string | null
    role?: string | null
    sectorsOk: boolean
    sectorsTotal: number
}

const MENU_ITEMS = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/company-users', label: 'Empresa e usuarios' },
    { href: '/dashboard/sectors', label: 'Setores' },
    { href: '/dashboard/employees', label: 'Colaboradores', requiresSectorsOk: true },
    { href: '/dashboard/situations', label: 'Situacoes', requiresSectorsOk: true },
    { href: '/dashboard/sales', label: 'Vendas', requiresSectorsOk: true },
    { href: '/dashboard/commissions', label: 'Comissoes', requiresSectorsOk: true },
]

function ItemLink({
    href,
    label,
    active,
    disabled,
    onClick,
}: {
    href: string
    label: string
    active: boolean
    disabled?: boolean
    onClick?: () => void
}) {
    if (disabled) {
        return (
            <span
                aria-disabled="true"
                className="block cursor-not-allowed rounded-xl px-3 py-2 text-sm font-semibold text-slate-400"
                title="Habilitado quando a soma dos setores ativos for 100%"
            >
                {label}
            </span>
        )
    }

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active
                    ? 'bg-(--color-primary) text-white'
                    : 'text-(--color-primary-strong) hover:bg-slate-100'
            }`}
        >
            {label}
        </Link>
    )
}

export function SidebarNav({ userName, role, sectorsOk, sectorsTotal }: Props) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <>
            <div className="border-b border-(--color-border) bg-white px-4 py-3 lg:hidden">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="rounded-xl border border-(--color-border) bg-white px-4 py-2 text-sm font-semibold text-(--color-primary-strong)"
                >
                    Menu
                </button>
            </div>

            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-72 lg:border-r lg:border-(--color-border) lg:bg-white/95 lg:backdrop-blur">
                <div className="flex h-full flex-col px-5 py-6">
                    <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                        Commission App
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-(--color-primary-strong)">
                        Menu
                    </h2>

                    <div
                        className={`mt-4 rounded-xl border px-3 py-2 text-xs font-semibold ${
                            sectorsOk
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                    >
                        Setores ativos: {sectorsTotal}% {sectorsOk ? '(OK)' : '(bloqueio ativo)'}
                    </div>

                    <nav className="mt-6 space-y-2">
                        {MENU_ITEMS.map((item) => (
                            <ItemLink
                                key={item.href}
                                href={item.href}
                                label={item.label}
                                active={pathname === item.href}
                                disabled={Boolean(item.requiresSectorsOk && !sectorsOk)}
                            />
                        ))}
                    </nav>

                    <div className="mt-auto rounded-xl border border-(--color-border) bg-slate-50 px-3 py-3 text-xs text-(--color-muted)">
                        <p className="font-semibold text-(--color-primary-strong)">
                            {userName ?? 'Usuario'}
                        </p>
                        <p className="mt-1 uppercase">Perfil: {role ?? '-'}</p>
                    </div>
                </div>
            </aside>

            {open ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative h-full w-72 border-r border-(--color-border) bg-white px-5 py-6">
                        <p className="text-xs tracking-widest text-(--color-primary) uppercase">
                            Commission App
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-(--color-primary-strong)">
                            Menu
                        </h2>

                        <div
                            className={`mt-4 rounded-xl border px-3 py-2 text-xs font-semibold ${
                                sectorsOk
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-900'
                            }`}
                        >
                            Setores ativos: {sectorsTotal}%{' '}
                            {sectorsOk ? '(OK)' : '(bloqueio ativo)'}
                        </div>

                        <nav className="mt-6 space-y-2">
                            {MENU_ITEMS.map((item) => (
                                <ItemLink
                                    key={item.href}
                                    href={item.href}
                                    label={item.label}
                                    active={pathname === item.href}
                                    disabled={Boolean(item.requiresSectorsOk && !sectorsOk)}
                                    onClick={() => setOpen(false)}
                                />
                            ))}
                        </nav>

                        <button
                            type="button"
                            className="mt-6 rounded-xl border border-(--color-border) px-3 py-2 text-sm font-semibold text-(--color-primary-strong)"
                            onClick={() => setOpen(false)}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            ) : null}
        </>
    )
}
