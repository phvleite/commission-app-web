import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { validateActiveSectorsPercentage } from '@/lib/api/business-rules'
import { connectDB } from '@/lib/db'
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

    await connectDB()
    const sectorStatus = await validateActiveSectorsPercentage(session.user.tenantId)

    return (
        <div className="app-shell min-h-screen">
            <SidebarNav
                userName={session.user.name}
                role={session.user.role}
                sectorsOk={sectorStatus.valid}
            />
            <div className="lg:pl-65">
                <div className="px-4 py-6 sm:px-6 sm:py-8">{children}</div>
            </div>
        </div>
    )
}
