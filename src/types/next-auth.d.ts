import type { DefaultSession } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        user: DefaultSession['user'] & {
            id: string
            tenantId: string
            role: 'admin' | 'manager' | 'seller'
        }
    }

    interface User {
        id: string
        tenantId: string
        role: 'admin' | 'manager' | 'seller'
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        tenantId?: string
        role?: 'admin' | 'manager' | 'seller'
    }
}

export {}
