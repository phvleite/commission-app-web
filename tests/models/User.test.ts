import { Types } from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { hashPassword } from '@/lib/password'
import { User } from '@/models/User'

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('User model', () => {
    it('permite criar ate 2 usuarios no mesmo tenant', async () => {
        const tenantId = new Types.ObjectId()

        await User.create({
            tenantId,
            name: 'Admin 1',
            email: 'admin1@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
        })

        await User.create({
            tenantId,
            name: 'Admin 2',
            email: 'admin2@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'manager',
        })

        const total = await User.countDocuments({ tenantId })
        expect(total).toBe(2)
    })

    it('bloqueia o 3o usuario no mesmo tenant', async () => {
        const tenantId = new Types.ObjectId()

        await User.create({
            tenantId,
            name: 'Admin 1',
            email: 'admin1@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
        })

        await User.create({
            tenantId,
            name: 'Admin 2',
            email: 'admin2@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'manager',
        })

        await expect(
            User.create({
                tenantId,
                name: 'Admin 3',
                email: 'admin3@empresa.com',
                passwordHash: await hashPassword('Senha@123'),
                role: 'seller',
            }),
        ).rejects.toThrow('Limite de 2 usuarios por tenant no pacote basico.')
    })

    it('permite 2 usuarios por tenant em tenants diferentes', async () => {
        const tenantA = new Types.ObjectId()
        const tenantB = new Types.ObjectId()

        await User.create({
            tenantId: tenantA,
            name: 'A1',
            email: 'a1@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
        })

        await User.create({
            tenantId: tenantA,
            name: 'A2',
            email: 'a2@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'manager',
        })

        await User.create({
            tenantId: tenantB,
            name: 'B1',
            email: 'b1@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
        })

        await User.create({
            tenantId: tenantB,
            name: 'B2',
            email: 'b2@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'manager',
        })

        expect(await User.countDocuments({ tenantId: tenantA })).toBe(2)
        expect(await User.countDocuments({ tenantId: tenantB })).toBe(2)
    })
})
