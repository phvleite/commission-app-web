import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { hashPassword } from '@/lib/password'
import { User } from '@/models/User'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { GET, PATCH, POST, PUT } from '@/app/api/platform-admin/users/route'

const authMock = auth as unknown as jest.Mock

function setPlatformSession(
    platformRole: 'platform_owner' | 'platform_admin' | 'platform_auditor' = 'platform_admin',
    userId = new Types.ObjectId().toString(),
) {
    authMock.mockResolvedValue({
        user: {
            id: userId,
            tenantId: '',
            role: 'admin',
            platformRole,
            email: 'owner@commission.com.br',
            name: 'Platform Admin',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('API platform admin users route', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        await clearTestDB()
    })

    it('GET lista apenas usuarios internos de plataforma', async () => {
        await User.collection.insertOne({
            name: 'Platform Owner',
            email: 'owner@commission.com.br',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
            platformRole: 'platform_owner',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await User.create({
            tenantId: new Types.ObjectId(),
            name: 'Tenant User',
            email: 'user@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'seller',
            active: true,
        })

        setPlatformSession('platform_owner')

        const res = await GET()

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            data: Array<{ email: string; platformRole: string }>
        }
        expect(payload.data).toHaveLength(1)
        expect(payload.data[0]?.email).toBe('owner@commission.com.br')
        expect(payload.data[0]?.platformRole).toBe('platform_owner')
    })

    it('POST cria usuario interno com role permitido', async () => {
        setPlatformSession('platform_owner')

        const res = await POST(
            new Request('http://localhost/api/platform-admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Auditor Interno',
                    email: 'auditor@commission.com.br',
                    password: 'Senha@123',
                    passwordConfirmation: 'Senha@123',
                    platformRole: 'platform_auditor',
                }),
            }),
        )

        expect(res.status).toBe(201)
        const payload = (await res.json()) as {
            data: { email: string; platformRole: string; passwordHash?: string }
        }

        expect(payload.data.email).toBe('auditor@commission.com.br')
        expect(payload.data.platformRole).toBe('platform_auditor')
        expect(payload.data.passwordHash).toBeUndefined()

        const created = await User.findOne({ email: 'auditor@commission.com.br' }).lean()
        expect(created).not.toBeNull()
        expect(created?.tenantId).toBeUndefined()
    })

    it('POST bloqueia email fora do dominio da plataforma', async () => {
        setPlatformSession('platform_owner')

        const res = await POST(
            new Request('http://localhost/api/platform-admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Usuario Externo',
                    email: 'externo@gmail.com',
                    password: 'Senha@123',
                    passwordConfirmation: 'Senha@123',
                    platformRole: 'platform_admin',
                }),
            }),
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('Usuarios de plataforma devem usar email @commission.com.br.')
    })

    it('PATCH alterna status de usuario interno', async () => {
        const owner = await User.collection.insertOne({
            name: 'Platform Owner',
            email: 'owner@commission.com.br',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
            platformRole: 'platform_owner',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        setPlatformSession('platform_owner', owner.insertedId.toString())

        const res = await PATCH(
            new Request('http://localhost/api/platform-admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: owner.insertedId.toString(),
                    active: false,
                }),
            }),
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('Nao e permitido inativar o proprio usuario.')
    })

    it('PATCH bloqueia inativar o ultimo platform owner', async () => {
        const owner = await User.collection.insertOne({
            name: 'Platform Owner',
            email: 'owner@commission.com.br',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
            platformRole: 'platform_owner',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await User.collection.insertOne({
            name: 'Platform Admin',
            email: 'admin@commission.com.br',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
            platformRole: 'platform_admin',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        setPlatformSession('platform_admin')

        const res = await PATCH(
            new Request('http://localhost/api/platform-admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: owner.insertedId.toString(),
                    active: false,
                }),
            }),
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('Nao e permitido inativar o ultimo platform owner.')
    })

    it('PUT atualiza nome, email e perfil de usuario interno', async () => {
        const owner = await User.collection.insertOne({
            name: 'Platform Owner',
            email: 'owner@commission.com.br',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
            platformRole: 'platform_owner',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        setPlatformSession('platform_owner', owner.insertedId.toString())

        const res = await PUT(
            new Request('http://localhost/api/platform-admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: owner.insertedId.toString(),
                    name: 'Platform Owner Atualizado',
                    email: 'owner.atualizado@commission.com.br',
                    platformRole: 'platform_admin',
                }),
            }),
        )

        expect(res.status).toBe(200)
        const payload = (await res.json()) as {
            data: { name: string; email: string; platformRole: string }
        }

        expect(payload.data.name).toBe('Platform Owner Atualizado')
        expect(payload.data.email).toBe('owner.atualizado@commission.com.br')
        expect(payload.data.platformRole).toBe('platform_admin')

        const updated = await User.findById(owner.insertedId).lean()
        expect(updated?.name).toBe('Platform Owner Atualizado')
        expect(updated?.email).toBe('owner.atualizado@commission.com.br')
        expect(updated?.platformRole).toBe('platform_admin')
    })
})
