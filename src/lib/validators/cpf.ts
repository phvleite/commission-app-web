function sanitizeCpfInput(cpfInput: string): string {
    return String(cpfInput).replace(/\D/g, '')
}

function calculateDigit(positions: string, initialWeight: number): number {
    let sum = 0
    let weight = initialWeight

    for (let index = 0; index < positions.length; index += 1) {
        sum += Number(positions[index]) * weight
        weight -= 1
    }

    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
}

export function isValidCpf(value: string): boolean {
    const cpf = sanitizeCpfInput(value)

    if (cpf.length !== 11) {
        return false
    }

    if (/^(\d)\1+$/.test(cpf)) {
        return false
    }

    const digit1 = calculateDigit(cpf.slice(0, 9), 10)
    if (Number(cpf[9]) !== digit1) {
        return false
    }

    const digit2 = calculateDigit(cpf.slice(0, 10), 11)
    if (Number(cpf[10]) !== digit2) {
        return false
    }

    return true
}

export function normalizeCpf(value: string): string {
    return sanitizeCpfInput(value)
}
