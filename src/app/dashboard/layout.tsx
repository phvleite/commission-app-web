import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { validateActiveSectorsPercentage } from '@/lib/api/business-rules'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
import { connectDB } from '@/lib/db'
import { Sector } from '@/models/Sector'
import { SidebarNav } from './_components/SidebarNav'
import { SessionActivityHeartbeat } from './_components/SessionActivityHeartbeat'

function DashboardShell({
    children,
    role,
    sectorsOk,
    hasMeritocraciaSector,
    userName,
    onSignOut,
}: Readonly<{
    children: React.ReactNode
    role?: string | null
    sectorsOk: boolean
    hasMeritocraciaSector: boolean
    userName?: string | null
    onSignOut: () => Promise<void>
}>) {
    return (
        <div className="app-shell min-h-screen">
            <SessionActivityHeartbeat />
            <SidebarNav
                userName={userName}
                role={role}
                sectorsOk={sectorsOk}
                hasMeritocraciaSector={hasMeritocraciaSector}
                onSignOut={onSignOut}
            />
            <div className="lg:pl-72">
                <div className="px-4 py-6 sm:px-6 sm:py-8">{children}</div>
            </div>
        </div>
    )
}

function DatabaseUnavailableMessage() {
    return (
        <section className="max-w-3xl rounded-lg border border-red-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
            <h1 className="text-lg font-semibold text-red-700">Banco de dados indisponível</h1>
            <p className="mt-2">
                Não foi possível conectar ao banco de dados agora. Verifique sua conexão e tente
                novamente em instantes.
            </p>
        </section>
    )
}

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (session.user.platformRole) {
        redirect('/platform-admin')
    }

    async function handleSignOut() {
        'use server'
        await signOut({ redirectTo: '/login' })
    }

    let sectorsOk = false
    let hasMeritocraciaSector = false
    let databaseUnavailable = false

    try {
        await connectDB()
        const sectorStatus = await validateActiveSectorsPercentage(session.user.tenantId)
        sectorsOk = sectorStatus.valid
        hasMeritocraciaSector = await Sector.exists({
            tenantId: session.user.tenantId,
            isMeritocracia: true,
        }).then(Boolean)
    } catch (error) {
        if (!isDatabaseConnectionError(error)) {
            throw error
        }

        databaseUnavailable = true
    }

    return (
        <DashboardShell
            userName={session.user.name}
            role={session.user.role}
            sectorsOk={sectorsOk}
            hasMeritocraciaSector={hasMeritocraciaSector}
            onSignOut={handleSignOut}
        >
            {databaseUnavailable ? <DatabaseUnavailableMessage /> : children}
        </DashboardShell>
    )
}
