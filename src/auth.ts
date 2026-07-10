import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authorizeCredentials } from '@/lib/auth/authorize'

function toOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: {
        strategy: 'jwt',
    },
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                tenantSlug: { label: 'Tenant', type: 'text' },
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            authorize: async (credentials) => {
                return authorizeCredentials({
                    tenantSlug: toOptionalString(credentials?.tenantSlug),
                    email: toOptionalString(credentials?.email),
                    password: toOptionalString(credentials?.password),
                })
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.sub = user.id
                token.tenantId = user.tenantId
                token.role = user.role
            }
            return token
        },
        session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub
                session.user.tenantId = token.tenantId as string
                session.user.role = token.role as 'admin' | 'manager' | 'seller'
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
})
