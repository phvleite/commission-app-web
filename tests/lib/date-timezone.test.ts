import {
    formatDateToYmdInTimeZone,
    getUtcRangeForCalendarDay,
    getUtcRangeForCalendarMonth,
    normalizeTimeZone,
    resolveRequestTimeZone,
} from '@/lib/date-timezone'

describe('date-timezone helpers', () => {
    it('normalizes invalid timezone to default', () => {
        expect(normalizeTimeZone('America/Sao_Paulo')).toBe('America/Sao_Paulo')
        expect(normalizeTimeZone('Invalid/Zone')).toBe('UTC')
    })

    it('resolves request timezone prioritizing x-user-timezone header', () => {
        const req = new Request('http://localhost', {
            headers: { 'x-user-timezone': 'America/New_York' },
        })

        expect(resolveRequestTimeZone(req, 'America/Sao_Paulo')).toBe('America/New_York')
    })

    it('builds UTC day range from local date in given timezone', () => {
        const range = getUtcRangeForCalendarDay('2026-07-30', 'America/Sao_Paulo')

        expect(range).not.toBeNull()
        expect(range?.dateKey).toBe('2026-07-30')
        expect(range?.start.toISOString()).toBe('2026-07-30T03:00:00.000Z')
        expect(range?.end.toISOString()).toBe('2026-07-31T02:59:59.999Z')
    })

    it('builds UTC month range from local month in given timezone', () => {
        const range = getUtcRangeForCalendarMonth(2026, 7, 'America/Sao_Paulo')

        expect(range.start.toISOString()).toBe('2026-07-01T03:00:00.000Z')
        expect(range.end.toISOString()).toBe('2026-08-01T02:59:59.999Z')
    })

    it('formats date to local YYYY-MM-DD by timezone', () => {
        expect(formatDateToYmdInTimeZone('2026-07-30T01:00:00.000Z', 'America/Sao_Paulo')).toBe(
            '2026-07-29',
        )
        expect(formatDateToYmdInTimeZone('2026-07-30T01:00:00.000Z', 'UTC')).toBe('2026-07-30')
        expect(formatDateToYmdInTimeZone('invalid', 'UTC')).toBe('')
    })
})
