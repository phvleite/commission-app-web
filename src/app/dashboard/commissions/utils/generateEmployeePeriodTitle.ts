import { formatDateToBR } from './formatDate'

export function generateEmployeePeriodTitle(name: string, start: string, end: string) {
    if (!start || !end) {
        return `GORJETAS DE ${name} - PERIODO INVALIDO`
    }

    if (start === end) {
        return `GORJETAS DE ${name} - DIA ${formatDateToBR(start)}`
    }

    const [yi, mi, di] = start.split('-')
    const [yf, mf, df] = end.split('-')

    const lastDay = new Date(Number(yi), Number(mi), 0).getDate()

    if (di === '01' && df === String(lastDay).padStart(2, '0') && mi === mf && yi === yf) {
        const months = [
            'JANEIRO',
            'FEVEREIRO',
            'MARCO',
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

        const monthName = months[Number(mi) - 1]

        return `GORJETAS DE ${name} - REF. ${monthName}/${yi}`
    }

    return `GORJETAS DE ${name} - DE ${formatDateToBR(start)} ATE ${formatDateToBR(end)}`
}
