import { registerTenantAndAdmin } from '@/app/signup/actions'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => clearTestDB())

function form(values: Record<string, string>): FormData {
    const formData = new FormData()
    for (const [key, value] of Object.entries(values)) {
        formData.set(key, value)
    }
    return formData
}

describe('signup action', () => {
    it('retorna erro quando faltam campos obrigatorios', async () => {
        const result = await registerTenantAndAdmin({}, form({ companyName: 'Empresa' }))
        expect(result).toEqual({ error: 'Preencha todos os campos obrigatorios.' })
    })

    it('retorna erro para senha curta', async () => {
        const result = await registerTenantAndAdmin(
            {},
            form({
                companyName: 'Empresa',
                legalName: 'Empresa LTDA',
                adminName: 'Admin',
                adminEmail: 'admin@empresa.com',
                password: '123',
                passwordConfirm: '123',
            }),
        )

        expect(result).toEqual({ error: 'A senha precisa ter no minimo 8 caracteres.' })
    })

    it('cria tenant + usuario admin com sucesso', async () => {
        const result = await registerTenantAndAdmin(
            {},
            form({
                companyName: 'Empresa Alpha',
                legalName: 'Empresa Alpha LTDA',
                tenantSlug: 'empresa-alpha',
                adminName: 'Admin Alpha',
                adminEmail: 'admin@alpha.com',
                password: 'Senha@123',
                passwordConfirm: 'Senha@123',
                street: 'Rua A',
                number: '10',
                neighborhood: 'Centro',
                city: 'Sao Paulo',
                state: 'SP',
                zipCode: '01000-000',
            }),
        )

        expect(result.success).toBeDefined()

        const tenant = await Tenant.findOne({ slug: 'empresa-alpha' })
        const user = await User.findOne({ email: 'admin@alpha.com' })

        expect(tenant).not.toBeNull()
        expect(user).not.toBeNull()
        expect(user?.role).toBe('admin')
        expect(user?.passwordHash).not.toBe('Senha@123')
    })

    it('bloqueia slug duplicado de tenant', async () => {
        await registerTenantAndAdmin(
            {},
            form({
                companyName: 'Empresa A',
                legalName: 'Empresa A LTDA',
                tenantSlug: 'empresa-a',
                adminName: 'Admin A',
                adminEmail: 'admin@a.com',
                password: 'Senha@123',
                passwordConfirm: 'Senha@123',
            }),
        )

        const result = await registerTenantAndAdmin(
            {},
            form({
                companyName: 'Empresa B',
                legalName: 'Empresa B LTDA',
                tenantSlug: 'empresa-a',
                adminName: 'Admin B',
                adminEmail: 'admin@b.com',
                password: 'Senha@123',
                passwordConfirm: 'Senha@123',
            }),
        )

        expect(result).toEqual({ error: 'Este slug de tenant ja esta em uso.' })
    })
})
