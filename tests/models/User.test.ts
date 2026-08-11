import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { hashPassword } from '@/lib/password'
import { User } from '@/models/User'
import { Tenant } from '@/models/Tenant'

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('User model', () => {
    it('permite criar ate 4 usuarios no mesmo tenant por padrao', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa Padrao 4',
            legalName: 'Empresa Padrao 4 LTDA',
            slug: 'empresa-padrao-4',
        })
        const tenantId = tenant._id

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

        await User.create({
            tenantId,
            name: 'Admin 3',
            email: 'admin3@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'seller',
        })

        await User.create({
            tenantId,
            name: 'Admin 4',
            email: 'admin4@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'seller',
        })

        const total = await User.countDocuments({ tenantId })
        expect(total).toBe(4)
    })

    it('bloqueia o 5o usuario no mesmo tenant quando usa limite padrao do plano', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa Padrao 4-B',
            legalName: 'Empresa Padrao 4-B LTDA',
            slug: 'empresa-padrao-4-b',
        })
        const tenantId = tenant._id

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

        await User.create({
            tenantId,
            name: 'Admin 3',
            email: 'admin3@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'seller',
        })

        await User.create({
            tenantId,
            name: 'Admin 4',
            email: 'admin4@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'seller',
        })

        await expect(
            User.create({
                tenantId,
                name: 'Admin 5',
                email: 'admin5@empresa.com',
                passwordHash: await hashPassword('Senha@123'),
                role: 'seller',
            }),
        ).rejects.toThrow('Limite de 4 usuarios por tenant para o plano atual.')
    })

    it('respeita o limite derivado do planCode do tenant', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa Plano 50',
            legalName: 'Empresa Plano 50 LTDA',
            slug: 'empresa-plano-50',
            planCode: 'plan_50',
            maxUsers: 1,
        })

        for (const index of [1, 2, 3, 4, 5]) {
            await User.create({
                tenantId: tenant._id,
                name: `A${index}`,
                email: `a${index}@empresa.com`,
                passwordHash: await hashPassword('Senha@123'),
                role: index === 1 ? 'admin' : 'manager',
            })
        }

        await expect(
            User.create({
                tenantId: tenant._id,
                name: 'A6',
                email: 'a6@empresa.com',
                passwordHash: await hashPassword('Senha@123'),
                role: 'manager',
            }),
        ).rejects.toThrow('Limite de 5 usuarios por tenant para o plano atual.')
    })

    it('permite ate o limite padrao em tenants diferentes', async () => {
        const tenantA = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A LTDA',
            slug: 'empresa-a-user-limit',
        })
        const tenantB = await Tenant.create({
            name: 'Empresa B',
            legalName: 'Empresa B LTDA',
            slug: 'empresa-b-user-limit',
        })

        await User.create({
            tenantId: tenantA._id,
            name: 'A1',
            email: 'a1@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
        })

        await User.create({
            tenantId: tenantA._id,
            name: 'A2',
            email: 'a2@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'manager',
        })

        await User.create({
            tenantId: tenantB._id,
            name: 'B1',
            email: 'b1@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'admin',
        })

        await User.create({
            tenantId: tenantB._id,
            name: 'B2',
            email: 'b2@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'manager',
        })

        await User.create({
            tenantId: tenantB._id,
            name: 'B3',
            email: 'b3@empresa.com',
            passwordHash: await hashPassword('Senha@123'),
            role: 'seller',
        })

        expect(await User.countDocuments({ tenantId: tenantA._id })).toBe(2)
        expect(await User.countDocuments({ tenantId: tenantB._id })).toBe(3)
    })
})
