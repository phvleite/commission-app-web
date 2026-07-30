import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: DefaultSession['user'] & {
            id: string
            tenantId: string
            role: 'admin' | 'manager' | 'seller'
            tenantName: string
            tenantTimeZone?: string
        }
    }

    interface User {
        id: string
        tenantId: string
        role: 'admin' | 'manager' | 'seller'
        tenantName: string
        tenantTimeZone?: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        tenantId?: string
        role?: 'admin' | 'manager' | 'seller'
        tenantName?: string
        tenantTimeZone?: string
    }
}

export {}
