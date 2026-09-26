import { formatDateToBR } from './formatDate'

export type PeriodDescription =
    | { type: 'invalid' }
    | { type: 'day'; date: string }
    | { type: 'month'; month: string; year: string }
    | { type: 'range'; start: string; end: string }

const MONTH_NAMES = [
    'JANEIRO',
    'FEVEREIRO',
    'MARÇO',
    'ABRIL',
    'MAIO',
    'JUNHO',
    'JULHO',
    'AGOSTO',
    'SETEMBRO',
    'OUTUBRO',
    'NOVEMBRO',
    'DEZEMBRO',
]

export function getPeriodDescription(start: string, end: string): PeriodDescription {
    if (!start || !end) return { type: 'invalid' }

    if (start === end) {
        return { type: 'day', date: formatDateToBR(start) }
    }

    const [startYear, startMonth, startDay] = start.split('-')
    const [endYear, endMonth, endDay] = end.split('-')
    const lastDay = new Date(Number(startYear), Number(startMonth), 0).getDate()

    if (
        startDay === '01' &&
        endDay === String(lastDay).padStart(2, '0') &&
        startMonth === endMonth &&
        startYear === endYear
    ) {
        return {
            type: 'month',
            month: MONTH_NAMES[Number(startMonth) - 1],
            year: startYear,
        }
    }

    return {
        type: 'range',
        start: formatDateToBR(start),
        end: formatDateToBR(end),
    }
}
