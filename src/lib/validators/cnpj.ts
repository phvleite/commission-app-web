function sanitizeCnpjInput(cnpjInput: string): string {
    return String(cnpjInput)
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
}

function calculateDigit(positions: string): number {
    let weight = 2
    let sum = 0

    for (let index = positions.length - 1; index >= 0; index -= 1) {
        const numericValue = positions.charCodeAt(index) - 48
        sum += numericValue * weight
        weight = weight === 9 ? 2 : weight + 1
    }

    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
}

export function isValidCnpj(value: string): boolean {
    const cnpj = sanitizeCnpjInput(value)

    if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)) {
        return false
    }

    if (/^([A-Z0-9])\1+$/.test(cnpj)) {
        return false
    }

    const digit1 = calculateDigit(cnpj.slice(0, 12))
    if (Number(cnpj[12]) !== digit1) {
        return false
    }

    const digit2 = calculateDigit(cnpj.slice(0, 13))
    if (Number(cnpj[13]) !== digit2) {
        return false
    }

    return true
}

export function normalizeCnpj(value: string): string {
    return sanitizeCnpjInput(value)
}
