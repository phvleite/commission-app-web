import { getPeriodDescription } from './getPeriodDescription'

export function generateEmployeePeriodTitle(name: string, start: string, end: string) {
    const period = getPeriodDescription(start, end)

    switch (period.type) {
        case 'invalid':
            return `GORJETAS DE ${name} - PERÍODO INVÁLIDO`
        case 'day':
            return `GORJETAS DE ${name} - DIA ${period.date}`
        case 'month':
            return `GORJETAS DE ${name} - REF. ${period.month}/${period.year}`
        case 'range':
            return `GORJETAS DE ${name} - DE ${period.start} ATÉ ${period.end}`
    }
}
