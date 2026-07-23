// YYYY-MM-DD → DD/MM/YYYY
export function formatDateToBR(dateStr: string) {
    if (!dateStr) return ''

    const [yyyy, mm, dd] = dateStr.split('-')
    if (!yyyy || !mm || !dd) return dateStr

    return `${dd}/${mm}/${yyyy}`
}

// DD/MM/YYYY → YYYY-MM-DD
export function formatDateToISO(dateStr: string) {
    if (!dateStr) return ''

    const [dd, mm, yyyy] = dateStr.split('/')
    if (!dd || !mm || !yyyy) return dateStr

    return `${yyyy}-${mm}-${dd}`
}

// Normalize for <input type="date">
export function normalizeDateForInput(dateStr: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        return formatDateToISO(dateStr)
    }

    return dateStr
}

// Format DB date → BR format
export function formatDateFromDatabase(dateStr: string) {
    return formatDateToBR(dateStr)
}
