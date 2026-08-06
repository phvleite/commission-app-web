import {
    currencyToNumber,
    formatCurrencyFromDatabase,
    formatCurrencyInput,
} from '@/utils/formatCurrency'
import { formatDateFromDatabase } from '@/utils/formatDate'

describe('shared utils', () => {
    it('formats currency input from raw digits', () => {
        expect(formatCurrencyInput('')).toBe('')
        expect(formatCurrencyInput('1')).toBe('0,01')
        expect(formatCurrencyInput('123456')).toBe('1.234,56')
        expect(formatCurrencyInput('R$ 99,90')).toBe('99,90')
    })

    it('converts formatted currency string to number', () => {
        expect(currencyToNumber('1.234,56')).toBe(1234.56)
        expect(currencyToNumber('99,90')).toBe(99.9)
        expect(Number.isNaN(currencyToNumber('abc'))).toBe(true)
    })

    it('formats cents from database to br currency format', () => {
        expect(formatCurrencyFromDatabase(0)).toBe('0,00')
        expect(formatCurrencyFromDatabase(123456)).toBe('1.234,56')
        expect(formatCurrencyFromDatabase(Number.NaN)).toBe('0,00')
    })

    it('formats date in pt-BR and handles invalid values', () => {
        expect(formatDateFromDatabase('2026-07-30T00:00:00.000Z')).toBe('30/07/2026')
        expect(formatDateFromDatabase(new Date('2026-01-01T00:00:00.000Z'))).toBe('01/01/2026')
        expect(formatDateFromDatabase('invalid-date')).toBe('')
    })
})
