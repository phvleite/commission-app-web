jest.mock('@/lib/email', () => ({
    sendSignupConfirmationEmail: jest.fn(),
}))

import {
    confirmTenantAndAdminSignup,
    registerTenantAndAdmin,
    resendSignupConfirmationCode,
} from '@/app/signup/actions'
import { connectTestDB, disconnectTestDB, clearTestDB } from '@/lib/test-db'
import { Tenant } from '@/models/Tenant'
import { User } from '@/models/User'
import { sendSignupConfirmationEmail } from '@/lib/email'

const sendSignupConfirmationEmailMock = sendSignupConfirmationEmail as jest.Mock

beforeAll(async () => connectTestDB())
afterAll(async () => disconnectTestDB())
afterEach(async () => {
    sendSignupConfirmationEmailMock.mockReset()
    await clearTestDB()
})

function form(values: Record<string, string>): FormData {
    const formData = new FormData()
    for (const [key, value] of Object.entries(values)) {
        formData.set(key, value)
    }
    return formData
}

function requiredSignupFields(overrides: Record<string, string> = {}): Record<string, string> {
    return {
        companyName: 'Empresa Alpha',
        legalName: 'Empresa Alpha LTDA',
        companyCnpj: '11.222.333/0001-81',
        companyEmail: 'contato@alpha.com',
        companyPhoneCommercial: '(11) 3333-4444',
        companyPhoneMobile: '(11) 98888-7777',
        planCode: 'plan_20',
        adminName: 'Admin Alpha',
        adminEmail: 'admin@alpha.com',
        adminCpf: '529.982.247-25',
        adminPhoneMobile: '(11) 98765-4321',
        password: 'Senha@123',
        passwordConfirm: 'Senha@123',
        ...overrides,
    }
}

describe('signup action', () => {
    it('retorna erro quando faltam campos obrigatorios', async () => {
        const result = await registerTenantAndAdmin({}, form({ companyName: 'Empresa' }))
        expect(result).toEqual({ error: 'Preencha todos os campos obrigatorios.' })
    })

    it('retorna erro para senha curta', async () => {
        const result = await registerTenantAndAdmin(
            {},
            form(requiredSignupFields({ password: '123', passwordConfirm: '123' })),
        )

        expect(result).toEqual({ error: 'A senha precisa ter no minimo 8 caracteres.' })
    })

    it('envia codigo e conclui o cadastro apos confirmacao', async () => {
        const registerResult = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    planCode: 'plan_100_plus',
                    street: 'Rua A',
                    number: '10',
                    neighborhood: 'Centro',
                    city: 'Sao Paulo',
                    state: 'SP',
                    zipCode: '01000-000',
                }),
            ),
        )

        expect(registerResult.success).toContain('codigo de confirmacao')
        expect(registerResult.verificationPending).toBe(true)
        expect(registerResult.signupRequestId).toBeDefined()
        expect(registerResult.verificationEmail).toBe('admin@alpha.com')
        expect(sendSignupConfirmationEmailMock).toHaveBeenCalledTimes(1)

        const sentCode = sendSignupConfirmationEmailMock.mock.calls[0][0].code as string

        expect(await Tenant.findOne({ slug: 'empresa-alpha' })).toBeNull()
        expect(await User.findOne({ email: 'admin@alpha.com' })).toBeNull()

        const confirmResult = await confirmTenantAndAdminSignup(
            {},
            form({
                signupRequestId: registerResult.signupRequestId ?? '',
                verificationCode: sentCode,
            }),
        )

        expect(confirmResult.success).toBeDefined()
        expect(confirmResult.loginUrl).toBe('/login')

        const tenant = await Tenant.findOne({ slug: 'empresa-alpha' })
        const user = await User.findOne({ email: 'admin@alpha.com' })

        expect(tenant).not.toBeNull()
        expect(user).not.toBeNull()
        expect(user?.role).toBe('admin')
        expect(user?.passwordHash).not.toBe('Senha@123')
        expect(tenant?.cnpj).toBe('11222333000181')
        expect(tenant?.phoneCommercial).toBe('(11) 3333-4444')
        expect(tenant?.phoneMobile).toBe('(11) 98888-7777')
        expect(tenant?.email).toBe('contato@alpha.com')
        expect(tenant?.planCode).toBe('plan_100_plus')
        expect(tenant?.maxUsers).toBe(8)
        expect(user?.cpf).toBe('52998224725')
        expect(user?.phone).toBe('(11) 98765-4321')
    })

    it('bloqueia slug duplicado de tenant', async () => {
        const first = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyName: 'Empresa A',
                    legalName: 'Empresa A LTDA',
                    adminName: 'Admin A',
                    adminEmail: 'admin@a.com',
                    companyEmail: 'contato@a.com',
                }),
            ),
        )

        const firstCode = sendSignupConfirmationEmailMock.mock.calls[0][0].code as string
        await confirmTenantAndAdminSignup(
            {},
            form({
                signupRequestId: first.signupRequestId ?? '',
                verificationCode: firstCode,
            }),
        )

        const result = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyName: 'Empresa A',
                    legalName: 'Empresa B LTDA',
                    adminName: 'Admin B',
                    adminEmail: 'admin@b.com',
                    companyEmail: 'contato@b.com',
                }),
            ),
        )

        expect(result).toEqual({ error: 'Este slug de tenant ja esta em uso.' })
    })

    it('bloqueia cadastro quando CNPJ ja existe em outro tenant', async () => {
        const first = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyName: 'Empresa Cnpj 1',
                    legalName: 'Empresa Cnpj 1 LTDA',
                    adminName: 'Admin Cnpj 1',
                    adminEmail: 'admin-cnpj-1@empresa.com',
                    companyEmail: 'contato-cnpj-1@empresa.com',
                    companyCnpj: '11.222.333/0001-81',
                }),
            ),
        )

        const firstCode = sendSignupConfirmationEmailMock.mock.calls[0][0].code as string
        await confirmTenantAndAdminSignup(
            {},
            form({
                signupRequestId: first.signupRequestId ?? '',
                verificationCode: firstCode,
            }),
        )

        const result = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyName: 'Empresa Cnpj 2',
                    legalName: 'Empresa Cnpj 2 LTDA',
                    adminName: 'Admin Cnpj 2',
                    adminEmail: 'admin-cnpj-2@empresa.com',
                    companyEmail: 'contato-cnpj-2@empresa.com',
                    companyCnpj: '11.222.333/0001-81',
                }),
            ),
        )

        expect(result).toEqual({ error: 'Ja existe empresa com este CNPJ.' })
    })

    it('permite cadastro sem telefone fixo da empresa', async () => {
        const result = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyPhoneCommercial: '',
                    adminEmail: 'admin-sem-fixo@alpha.com',
                    companyEmail: 'contato-sem-fixo@alpha.com',
                }),
            ),
        )

        const code = sendSignupConfirmationEmailMock.mock.calls[0][0].code as string
        const confirmResult = await confirmTenantAndAdminSignup(
            {},
            form({
                signupRequestId: result.signupRequestId ?? '',
                verificationCode: code,
            }),
        )

        expect(confirmResult.success).toBeDefined()

        const tenant = await Tenant.findOne({ slug: 'empresa-alpha' })
        expect(tenant).not.toBeNull()
        expect(tenant?.phoneCommercial).toBeUndefined()
    })

    it('bloqueia cadastro quando email do administrador ja existe na base', async () => {
        const first = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyName: 'Empresa Primeira',
                    legalName: 'Empresa Primeira LTDA',
                    companyEmail: 'primeira@empresa.com',
                    adminEmail: 'email.repetido@empresa.com',
                }),
            ),
        )

        const firstCode = sendSignupConfirmationEmailMock.mock.calls[0][0].code as string
        await confirmTenantAndAdminSignup(
            {},
            form({
                signupRequestId: first.signupRequestId ?? '',
                verificationCode: firstCode,
            }),
        )

        const result = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyName: 'Empresa Segunda',
                    legalName: 'Empresa Segunda LTDA',
                    companyEmail: 'segunda@empresa.com',
                    companyCnpj: '12.ABC.345/01DE-35',
                    adminEmail: 'email.repetido@empresa.com',
                }),
            ),
        )

        expect(result).toEqual({ error: 'Ja existe usuario com este email.' })
    })

    it('nao cria empresa quando email do administrador ja existe com caixa diferente', async () => {
        const first = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyName: 'Empresa Base',
                    legalName: 'Empresa Base LTDA',
                    companyEmail: 'base@empresa.com',
                    adminEmail: 'Email.Existente@Empresa.com',
                }),
            ),
        )

        const firstCode = sendSignupConfirmationEmailMock.mock.calls[0][0].code as string
        await confirmTenantAndAdminSignup(
            {},
            form({
                signupRequestId: first.signupRequestId ?? '',
                verificationCode: firstCode,
            }),
        )

        const tenantsBefore = await Tenant.countDocuments({})

        const result = await registerTenantAndAdmin(
            {},
            form(
                requiredSignupFields({
                    companyName: 'Empresa Sem Acesso',
                    legalName: 'Empresa Sem Acesso LTDA',
                    companyEmail: 'semaacesso@empresa.com',
                    companyCnpj: '71.506.168/0001-11',
                    adminEmail: 'email.existente@empresa.com',
                }),
            ),
        )

        const tenantsAfter = await Tenant.countDocuments({})

        expect(result).toEqual({ error: 'Ja existe usuario com este email.' })
        expect(tenantsAfter).toBe(tenantsBefore)
        await expect(Tenant.findOne({ slug: 'empresa-sem-acesso' }).lean()).resolves.toBeNull()
    })

    it('rejeita codigo de confirmacao invalido', async () => {
        const result = await registerTenantAndAdmin({}, form(requiredSignupFields()))

        const confirmResult = await confirmTenantAndAdminSignup(
            {},
            form({
                signupRequestId: result.signupRequestId ?? '',
                verificationCode: '000000',
            }),
        )

        expect(confirmResult.error).toBe('Codigo invalido. Tente novamente.')
        expect(await Tenant.findOne({ slug: 'empresa-alpha' })).toBeNull()
    })

    it('permite corrigir e-mail e reenviar codigo de confirmacao', async () => {
        const registerResult = await registerTenantAndAdmin({}, form(requiredSignupFields()))

        const resendResult = await resendSignupConfirmationCode(
            {},
            form({
                signupRequestId: registerResult.signupRequestId ?? '',
                adminEmail: 'admin.correto@alpha.com',
            }),
        )

        expect(resendResult.error).toBeUndefined()
        expect(resendResult.success).toBe(
            'Reenviamos o codigo para admin.correto@alpha.com. Este sera o e-mail de acesso do administrador no cadastro.',
        )
        expect(resendResult.verificationEmail).toBe('admin.correto@alpha.com')
        expect(sendSignupConfirmationEmailMock).toHaveBeenCalledTimes(2)

        const resentCode = sendSignupConfirmationEmailMock.mock.calls[1][0].code as string

        const confirmResult = await confirmTenantAndAdminSignup(
            {},
            form({
                signupRequestId: registerResult.signupRequestId ?? '',
                verificationCode: resentCode,
            }),
        )

        expect(confirmResult.success).toBeDefined()
        const user = await User.findOne({ email: 'admin.correto@alpha.com' }).lean()
        expect(user).not.toBeNull()
    })
})
