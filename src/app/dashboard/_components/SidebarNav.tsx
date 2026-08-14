'use client'

import Image from 'next/image'
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
    { href: '/dashboard/situations', label: 'Situações', requiresSectorsOk: true },
    { href: '/dashboard/sales', label: 'Vendas', requiresSectorsOk: true },
    { href: '/dashboard/commissions', label: 'Gorjetas', requiresSectorsOk: true },
    { href: '/dashboard/company-users', label: 'Empresa/Usuários' },
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
                    <Link
                        href="/dashboard"
                        aria-label="Ir para a página inicial"
                        className="mb-6 inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
                    >
                        <Image
                            src="/logo-commission-star-name-gold.svg"
                            alt="Commission App"
                            width={240}
                            height={62}
                            priority
                            className="h-auto w-60"
                        />
                    </Link>

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

                    <div className="mt-auto flex justify-center">
                        <Image
                            src="/logo-commission-star-ball-white.svg"
                            alt="Logo Commission Star"
                            width={150}
                            height={150}
                            className="opacity-90"
                            style={{ width: '200px', height: '200px' }}
                        />
                    </div>

                    <div className="mt-4 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-xs text-slate-200">
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
                    <div className="sidebar relative h-full w-72 border-r border-white/20">
                        <Link
                            href="/dashboard"
                            aria-label="Ir para a página inicial"
                            className="mb-6 inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
                            onClick={() => setOpen(false)}
                        >
                            <Image
                                src="/logo-commission-star-name-white.svg"
                                alt="Commission App"
                                width={210}
                                height={55}
                                priority
                                className="h-auto w-52"
                            />
                        </Link>

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

                        <div className="mt-auto mb-4 flex justify-center">
                            <Image
                                src="/logo-commission-star-ball-white.svg"
                                alt="Logo Commission Star"
                                width={200}
                                height={200}
                                className="opacity-90"
                                style={{ width: '62vw', maxWidth: '200px', height: 'auto' }}
                            />
                        </div>

                        <div className="mb-4 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-xs text-slate-200">
                            <p className="font-semibold text-white">{userName ?? 'Usuario'}</p>
                            <p className="mt-1 uppercase">Perfil: {role ?? '-'}</p>
                        </div>

                        <button
                            type="button"
                            className="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white"
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
