import { isValidCpf, normalizeCpf } from '@/lib/validators/cpf'

describe('cpf validator', () => {
    it('valida CPF conhecido valido', () => {
        expect(isValidCpf('529.982.247-25')).toBe(true)
    })

    it('rejeita sequencia repetida', () => {
        expect(isValidCpf('111.111.111-11')).toBe(false)
    })

    it('rejeita tamanho invalido', () => {
        expect(isValidCpf('1234567890')).toBe(false)
    })

    it('normaliza mascara', () => {
        expect(normalizeCpf('529.982.247-25')).toBe('52998224725')
    })
})
