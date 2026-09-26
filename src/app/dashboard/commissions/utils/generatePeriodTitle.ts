import { getPeriodDescription } from './getPeriodDescription'

export function generatePeriodTitle(start: string, end: string) {
    const period = getPeriodDescription(start, end)

    switch (period.type) {
        case 'invalid':
            return 'PERÍODO INVÁLIDO'
        case 'day':
            return `GORJETAS DO DIA ${period.date}`
        case 'month':
            return `GORJETAS REF. ${period.month}/${period.year}`
        case 'range':
            return `GORJETAS DE ${period.start} ATÉ ${period.end}`
    }
}
