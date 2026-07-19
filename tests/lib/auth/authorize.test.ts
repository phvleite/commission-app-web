import { authorizeCredentials } from '@/lib/auth/authorize'
import { hashPassword } from '@/lib/password'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

describe('authorizeCredentials', () => {
    it('retorna o usuário autenticado com email + password válidos', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa ABC',
            legalName: 'Empresa ABC Ltda',
            slug: 'empresa-abc',
        })

        const passwordHash = await hashPassword('Senha@123')
        await User.create({
            tenantId: tenant._id,
            name: 'Paulo',
            email: 'paulo@empresa.com',
            passwordHash,
            role: 'admin',
        })

        const user = await authorizeCredentials({
            email: 'paulo@empresa.com',
            password: 'Senha@123',
        })

        expect(user).toMatchObject({
            name: 'Paulo',
            email: 'paulo@empresa.com',
            role: 'admin',
        })
        expect(user?.tenantId).toBe(tenant._id.toString())
    })

    it('retorna null quando o email nao existe', async () => {
        const user = await authorizeCredentials({
            email: 'paulo@empresa.com',
            password: 'Senha@123',
        })

        expect(user).toBeNull()
    })

    it('retorna null quando a senha é inválida', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa ABC',
            legalName: 'Empresa ABC Ltda',
            slug: 'empresa-abc',
        })

        const passwordHash = await hashPassword('Senha@123')
        await User.create({
            tenantId: tenant._id,
            name: 'Paulo',
            email: 'paulo@empresa.com',
            passwordHash,
            role: 'admin',
        })

        const user = await authorizeCredentials({
            email: 'paulo@empresa.com',
            password: 'Errada@123',
        })

        expect(user).toBeNull()
    })

    it('retorna null quando o usuário está inativo', async () => {
        const tenant = await Tenant.create({
            name: 'Empresa ABC',
            legalName: 'Empresa ABC Ltda',
            slug: 'empresa-abc',
        })

        const passwordHash = await hashPassword('Senha@123')
        await User.create({
            tenantId: tenant._id,
            name: 'Paulo',
            email: 'paulo@empresa.com',
            passwordHash,
            role: 'admin',
            active: false,
        })

        const user = await authorizeCredentials({
            email: 'paulo@empresa.com',
            password: 'Senha@123',
        })

        expect(user).toBeNull()
    })

    it('retorna null quando faltam credenciais obrigatórias', async () => {
        await expect(authorizeCredentials({ email: 'paulo@empresa.com' })).resolves.toBeNull()
    })

    it('retorna null quando ha ambiguidade de email entre tenants', async () => {
        const tenantA = await Tenant.create({
            name: 'Empresa A',
            legalName: 'Empresa A Ltda',
            slug: 'empresa-a',
        })
        const tenantB = await Tenant.create({
            name: 'Empresa B',
            legalName: 'Empresa B Ltda',
            slug: 'empresa-b',
        })

        const hashA = await hashPassword('SenhaA@123')
        const hashB = await hashPassword('SenhaB@123')

        await User.create({
            tenantId: tenantA._id,
            name: 'Paulo A',
            email: 'paulo@empresa.com',
            passwordHash: hashA,
            role: 'manager',
        })
        await User.create({
            tenantId: tenantB._id,
            name: 'Paulo B',
            email: 'paulo@empresa.com',
            passwordHash: hashB,
            role: 'seller',
        })

        const user = await authorizeCredentials({
            email: 'paulo@empresa.com',
            password: 'SenhaB@123',
        })

        expect(user).toBeNull()
    })
})
