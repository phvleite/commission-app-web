import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: DefaultSession['user'] & {
            id: string
            tenantId: string
            role: 'admin' | 'manager' | 'seller'
            tenantName: string
        }
    }

    interface User {
        id: string
        tenantId: string
        role: 'admin' | 'manager' | 'seller'
        tenantName: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        tenantId?: string
        role?: 'admin' | 'manager' | 'seller'
        tenantName?: string
    }
}

export {}
