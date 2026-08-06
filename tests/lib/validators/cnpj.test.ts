import { isValidCnpj, normalizeCnpj } from '@/lib/validators/cnpj'

describe('cnpj validator', () => {
    it('valida CNPJ alfanumerico conforme NT 2025.001', () => {
        expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true)
    })

    it('valida CNPJ numerico legado', () => {
        expect(isValidCnpj('00.000.000/0001-91')).toBe(true)
    })

    it('rejeita CNPJ com DV invalido', () => {
        expect(isValidCnpj('12.ABC.345/01DE-00')).toBe(false)
    })

    it('normaliza mascara e uppercase', () => {
        expect(normalizeCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35')
    })
})
