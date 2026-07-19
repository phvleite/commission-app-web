export function formatCurrencyInput(rawValue: string): string {
    const digits = rawValue.replace(/\D/g, '')

    if (!digits) {
        return ''
    }

    const cents = Number(digits)
    const value = cents / 100

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

export function currencyToNumber(formattedValue: string): number {
    const normalized = formattedValue.replace(/\./g, '').replace(',', '.')
    const parsed = Number(normalized)

    return Number.isFinite(parsed) ? parsed : NaN
}

export function formatCurrencyFromDatabase(cents: number): string {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format((Number(cents) || 0) / 100)
}
