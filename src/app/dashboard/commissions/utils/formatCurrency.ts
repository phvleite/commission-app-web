// Format user input (string) → currency
export function formatCurrencyInput(value: string) {
    const onlyNumbers = value.replace(/\D/g, '')

    if (!onlyNumbers) return ''

    const numberValue = Number(onlyNumbers) / 100

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue)
}

// Format database value (centavos → reais)
export function formatCurrencyFromDatabase(centavos: number) {
    const numberValue = centavos / 100

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue)
}

// Convert formatted currency (R$ 1.234,56) → number (1234.56)
export function currencyToNumber(formatted: string) {
    if (!formatted) return 0

    return Number(
        formatted.replace(/\./g, '').replace(',', '.')
    )
}
