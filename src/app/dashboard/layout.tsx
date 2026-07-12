import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SidebarNav } from './_components/SidebarNav'

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <div className="app-shell min-h-screen">
            <SidebarNav userName={session.user.name} role={session.user.role} />
            <div className="lg:pl-72">
                <div className="px-4 py-6 sm:px-6 sm:py-8">{children}</div>
            </div>
        </div>
    )
}
