export function formatDateFromDatabase(value: string | Date): string {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'UTC',
    }).format(date)
}
