'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface Props {
    userName?: string | null
    role?: string | null
    sectorsOk: boolean
}

const MENU_ITEMS = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/sectors', label: 'Setores' },
    { href: '/dashboard/employees', label: 'Colaboradores', requiresSectorsOk: true },
    { href: '/dashboard/situations', label: 'Situacoes', requiresSectorsOk: true },
    { href: '/dashboard/sales', label: 'Vendas', requiresSectorsOk: true },
    { href: '/dashboard/commissions', label: 'Comissoes', requiresSectorsOk: true },
    { href: '/dashboard/company-users', label: 'Empresa/Usuarios' },
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
            <li
                className="sidebar-disabled"
                title="Habilitado quando a soma dos setores ativos for 100%"
            >
                <span aria-disabled="true" className="sidebar-link">
                    {label}
                </span>
            </li>
        )
    }

    return (
        <li>
            <Link
                href={href}
                onClick={onClick}
                className={`sidebar-link ${active ? 'active' : ''}`}
            >
                {label}
            </Link>
        </li>
    )
}

export function SidebarNav({ userName, role, sectorsOk }: Props) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <>
            <div className="border-b border-(--color-primary) bg-(--color-primary-strong) px-4 py-3 lg:hidden">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                    Menu
                </button>
            </div>

            <aside className="sidebar hidden lg:block">
                <div className="flex h-full flex-col">
                    <h2 className="sidebar-title">Commission App</h2>

                    <nav>
                        <ul>
                            {MENU_ITEMS.map((item) => (
                                <ItemLink
                                    key={item.href}
                                    href={item.href}
                                    label={item.label}
                                    active={pathname === item.href}
                                    disabled={Boolean(item.requiresSectorsOk && !sectorsOk)}
                                />
                            ))}
                        </ul>
                    </nav>

                    <div className="mt-auto rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-xs text-slate-200">
                        <p className="font-semibold text-white">{userName ?? 'Usuario'}</p>
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
                    <div className="sidebar relative h-full w-60 border-r border-white/20">
                        <h2 className="sidebar-title">Commission App</h2>

                        <nav>
                            <ul>
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
                            </ul>
                        </nav>

                        <button
                            type="button"
                            className="mt-6 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white"
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
