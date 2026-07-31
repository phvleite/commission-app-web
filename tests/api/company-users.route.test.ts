import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { hashPassword } from '@/lib/password'
import { User } from '@/models/User'

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

import { auth } from '@/auth'
import { GET, POST } from '@/app/api/company-users/route'
import { PATCH, PUT } from '@/app/api/company-users/[id]/route'
import { POST as postChangePassword } from '@/app/api/company-users/[id]/change-password/route'

const authMock = auth as unknown as jest.Mock

function setSession(
    tenantId: string,
    role: 'admin' | 'manager' | 'seller' = 'admin',
    userId = new Types.ObjectId().toString(),
) {
    authMock.mockResolvedValue({
        user: {
            id: userId,
            tenantId,
            role,
            email: 'admin@company.com',
            name: 'Admin',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    })
}

describe('API company users routes', () => {
    beforeAll(async () => connectTestDB())
    afterAll(async () => disconnectTestDB())
    afterEach(async () => {
        authMock.mockReset()
        await clearTestDB()
    })

    it('GET lista usuarios apenas do tenant autenticado', async () => {
        const tenantA = new Types.ObjectId()
        const tenantB = new Types.ObjectId()

        await User.create({
            tenantId: tenantA,
            name: 'A User',
            email: 'a@company.com',
            role: 'admin',
            passwordHash: await hashPassword('Senha@123'),
        })

        await User.create({
            tenantId: tenantB,
            name: 'B User',
            email: 'b@company.com',
            role: 'admin',
            passwordHash: await hashPassword('Senha@123'),
        })

        setSession(tenantA.toString(), 'manager')

        const res = await GET()
        expect(res.status).toBe(200)

        const payload = (await res.json()) as {
            data: Array<{ name: string; passwordHash?: string }>
        }
        expect(payload.data).toHaveLength(1)
        expect(payload.data[0].name).toBe('A User')
        expect(payload.data[0].passwordHash).toBeUndefined()
    })

    it('POST cria usuario quando perfil admin', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId, 'admin')

        const res = await POST(
            new Request('http://localhost/api/company-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Novo Usuario',
                    email: 'novo@company.com',
                    cpf: '529.982.247-25',
                    phone: '(11) 98888-7777',
                    password: 'Senha@123',
                    passwordConfirmation: 'Senha@123',
                    role: 'seller',
                }),
            }),
        )

        expect(res.status).toBe(201)
        const user = await User.findOne({ email: 'novo@company.com' }).lean()
        expect(user).not.toBeNull()
        expect(user?.cpf).toBe('52998224725')
    })

    it('POST rejeita CPF invalido', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId, 'admin')

        const res = await POST(
            new Request('http://localhost/api/company-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Novo Usuario',
                    email: 'novo@company.com',
                    cpf: '111.111.111-11',
                    password: 'Senha@123',
                    passwordConfirmation: 'Senha@123',
                    role: 'seller',
                }),
            }),
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('Informe um CPF valido.')
    })

    it('POST bloqueia manager para criar usuario', async () => {
        const tenantId = new Types.ObjectId().toString()
        setSession(tenantId, 'manager')

        const res = await POST(
            new Request('http://localhost/api/company-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Novo Usuario',
                    email: 'novo@company.com',
                    password: 'Senha@123',
                    passwordConfirmation: 'Senha@123',
                    role: 'seller',
                }),
            }),
        )

        expect(res.status).toBe(403)
    })

    it('PATCH inativa usuario quando admin', async () => {
        const tenantId = new Types.ObjectId()
        const admin = await User.create({
            tenantId,
            name: 'Admin',
            email: 'admin@company.com',
            role: 'admin',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })
        const seller = await User.create({
            tenantId,
            name: 'Seller',
            email: 'seller@company.com',
            role: 'seller',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })

        setSession(tenantId.toString(), 'admin', admin._id.toString())

        const res = await PATCH(
            new Request(`http://localhost/api/company-users/${seller._id.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: false }),
            }),
            { params: Promise.resolve({ id: seller._id.toString() }) },
        )

        expect(res.status).toBe(200)

        const updated = await User.findById(seller._id).lean()
        expect(updated?.active).toBe(false)
    })

    it('PATCH bloqueia inativar o proprio usuario', async () => {
        const tenantId = new Types.ObjectId()
        const admin = await User.create({
            tenantId,
            name: 'Admin',
            email: 'admin@company.com',
            role: 'admin',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })

        setSession(tenantId.toString(), 'admin', admin._id.toString())

        const res = await PATCH(
            new Request(`http://localhost/api/company-users/${admin._id.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: false }),
            }),
            { params: Promise.resolve({ id: admin._id.toString() }) },
        )

        expect(res.status).toBe(400)
    })

    it('PUT edita dados de usuario sem alterar senha', async () => {
        const tenantId = new Types.ObjectId()
        const admin = await User.create({
            tenantId,
            name: 'Admin',
            email: 'admin@company.com',
            role: 'admin',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })
        const seller = await User.create({
            tenantId,
            name: 'Seller',
            email: 'seller@company.com',
            role: 'seller',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })

        setSession(tenantId.toString(), 'admin', admin._id.toString())

        const res = await PUT(
            new Request(`http://localhost/api/company-users/${seller._id.toString()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Seller Atualizado',
                    email: 'seller.atualizado@company.com',
                    cpf: '529.982.247-25',
                    phone: '(11) 97777-1111',
                    role: 'manager',
                }),
            }),
            { params: Promise.resolve({ id: seller._id.toString() }) },
        )

        expect(res.status).toBe(200)

        const updated = await User.findById(seller._id).lean()
        expect(updated?.name).toBe('Seller Atualizado')
        expect(updated?.email).toBe('seller.atualizado@company.com')
        expect(updated?.cpf).toBe('52998224725')
        expect(updated?.phone).toBe('(11) 97777-1111')
        expect(updated?.role).toBe('manager')
        expect(updated?.passwordHash).toBe(seller.passwordHash)
    })

    it('POST change-password altera senha quando dados estao corretos', async () => {
        const tenantId = new Types.ObjectId()
        const admin = await User.create({
            tenantId,
            name: 'Admin',
            email: 'admin@company.com',
            role: 'admin',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })
        const seller = await User.create({
            tenantId,
            name: 'Seller',
            email: 'seller@company.com',
            role: 'seller',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })

        setSession(tenantId.toString(), 'admin', admin._id.toString())

        const res = await postChangePassword(
            new Request(
                `http://localhost/api/company-users/${seller._id.toString()}/change-password`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentPassword: 'Senha@123',
                        newPassword: 'NovaSenha@123',
                        newPasswordConfirmation: 'NovaSenha@123',
                    }),
                },
            ),
            { params: Promise.resolve({ id: seller._id.toString() }) },
        )

        expect(res.status).toBe(200)

        const updated = await User.findById(seller._id).lean()
        expect(updated?.passwordHash).not.toBe(seller.passwordHash)
    })

    it('POST change-password rejeita confirmacao divergente', async () => {
        const tenantId = new Types.ObjectId()
        const admin = await User.create({
            tenantId,
            name: 'Admin',
            email: 'admin@company.com',
            role: 'admin',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })
        const seller = await User.create({
            tenantId,
            name: 'Seller',
            email: 'seller@company.com',
            role: 'seller',
            passwordHash: await hashPassword('Senha@123'),
            active: true,
        })

        setSession(tenantId.toString(), 'admin', admin._id.toString())

        const res = await postChangePassword(
            new Request(
                `http://localhost/api/company-users/${seller._id.toString()}/change-password`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentPassword: 'Senha@123',
                        newPassword: 'NovaSenha@123',
                        newPasswordConfirmation: 'OutraSenha@123',
                    }),
                },
            ),
            { params: Promise.resolve({ id: seller._id.toString() }) },
        )

        expect(res.status).toBe(400)
        const payload = (await res.json()) as { error: string }
        expect(payload.error).toBe('A confirmacao da nova senha nao confere.')
    })
})
