/** Divide um total em centavos entre N partes, distribuindo o resto às primeiras posições. */
export function splitCents(total: number, parts: number): number[] {
    if (parts <= 0) return []

    const base = Math.floor(total / parts)
    const remainder = total % parts

    return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0))
}
