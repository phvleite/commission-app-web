import { hashPassword, verifyPassword } from '@/lib/password'

describe('password helpers', () => {
    it('gera hash diferente da senha original', async () => {
        const password = 'Senha@123'
        const passwordHash = await hashPassword(password)

        expect(passwordHash).not.toBe(password)
        expect(passwordHash.length).toBeGreaterThan(20)
    })

    it('valida a senha correta', async () => {
        const passwordHash = await hashPassword('Senha@123')
        await expect(verifyPassword('Senha@123', passwordHash)).resolves.toBe(true)
    })

    it('rejeita senha incorreta', async () => {
        const passwordHash = await hashPassword('Senha@123')
        await expect(verifyPassword('Outra@123', passwordHash)).resolves.toBe(false)
    })
})
