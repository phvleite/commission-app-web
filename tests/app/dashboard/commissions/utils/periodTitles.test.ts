import { generateEmployeePeriodTitle } from '@/app/dashboard/commissions/utils/generateEmployeePeriodTitle'
import { generatePeriodTitle } from '@/app/dashboard/commissions/utils/generatePeriodTitle'

describe('commission period titles', () => {
    it('formats a single day for general and employee reports', () => {
        expect(generatePeriodTitle('2026-09-26', '2026-09-26')).toBe('GORJETAS DO DIA 26/09/2026')
        expect(generateEmployeePeriodTitle('Ana', '2026-09-26', '2026-09-26')).toBe(
            'GORJETAS DE Ana - DIA 26/09/2026',
        )
    })

    it('recognizes a complete month for both reports', () => {
        expect(generatePeriodTitle('2026-02-01', '2026-02-28')).toBe('GORJETAS REF. FEVEREIRO/2026')
        expect(generateEmployeePeriodTitle('Ana', '2026-02-01', '2026-02-28')).toBe(
            'GORJETAS DE Ana - REF. FEVEREIRO/2026',
        )
    })

    it('formats a partial date range for both reports', () => {
        expect(generatePeriodTitle('2026-09-01', '2026-09-15')).toBe(
            'GORJETAS DE 01/09/2026 ATÉ 15/09/2026',
        )
        expect(generateEmployeePeriodTitle('Ana', '2026-09-01', '2026-09-15')).toBe(
            'GORJETAS DE Ana - DE 01/09/2026 ATÉ 15/09/2026',
        )
    })

    it('preserves invalid-period titles', () => {
        expect(generatePeriodTitle('', '2026-09-15')).toBe('PERÍODO INVÁLIDO')
        expect(generateEmployeePeriodTitle('Ana', '', '2026-09-15')).toBe(
            'GORJETAS DE Ana - PERÍODO INVÁLIDO',
        )
    })
})
