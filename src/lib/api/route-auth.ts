import { auth } from '@/auth'

export type SessionRole = 'admin' | 'manager' | 'seller'

export interface RouteSessionUser {
    id: string
    tenantId: string
    role: SessionRole
    email?: string | null
    name?: string | null
}

export async function getRouteSessionUser(): Promise<RouteSessionUser | null> {
    const session = await auth()

    if (!session?.user?.id || !session.user.tenantId || !session.user.role) {
        return null
    }

    return {
        id: session.user.id,
        tenantId: session.user.tenantId,
        role: session.user.role,
        email: session.user.email,
        name: session.user.name,
    }
}

export function canWrite(role: SessionRole): boolean {
    return role === 'admin' || role === 'manager'
}
