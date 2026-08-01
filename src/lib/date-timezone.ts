const DEFAULT_TIME_ZONE = 'UTC'

interface DateParts {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
}

function isValidTimeZone(value: string): boolean {
    try {
        Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date())
        return true
    } catch {
        return false
    }
}

function parseYmd(value: string): { year: number; month: number; day: number } | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (!match) {
        return null
    }

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])

    if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
        return null
    }

    return { year, month, day }
}

function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    })

    const parts = formatter.formatToParts(date)
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))

    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute),
        second: Number(map.second),
    }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const local = getDatePartsInTimeZone(date, timeZone)
    const asUtc = Date.UTC(
        local.year,
        local.month - 1,
        local.day,
        local.hour,
        local.minute,
        local.second,
    )

    return asUtc - date.getTime()
}

function zonedDateTimeToUtc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    timeZone: string,
): Date {
    let guess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)

    for (let i = 0; i < 4; i += 1) {
        const offset = getTimeZoneOffsetMs(new Date(guess), timeZone)
        const candidate = Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - offset
        if (candidate === guess) {
            break
        }
        guess = candidate
    }

    return new Date(guess)
}

function toYmd(value: { year: number; month: number; day: number }): string {
    const mm = String(value.month).padStart(2, '0')
    const dd = String(value.day).padStart(2, '0')
    return `${value.year}-${mm}-${dd}`
}

export function normalizeTimeZone(
    value: string | null | undefined,
    fallback = DEFAULT_TIME_ZONE,
): string {
    if (value && isValidTimeZone(value)) {
        return value
    }

    if (fallback && isValidTimeZone(fallback)) {
        return fallback
    }

    return DEFAULT_TIME_ZONE
}

export function resolveRequestTimeZone(
    req: Request,
    tenantTimeZone?: string | null,
    defaultTimeZone = DEFAULT_TIME_ZONE,
): string {
    const requestTimeZone = req.headers.get('x-user-timezone')
    if (requestTimeZone && isValidTimeZone(requestTimeZone)) {
        return requestTimeZone
    }

    return normalizeTimeZone(tenantTimeZone, defaultTimeZone)
}

export function getUtcRangeForCalendarDay(
    input: string | Date,
    timeZone: string,
): { start: Date; end: Date; dateKey: string } | null {
    const normalizedTimeZone = normalizeTimeZone(timeZone)

    let ymd: { year: number; month: number; day: number } | null = null

    if (typeof input === 'string') {
        ymd = parseYmd(input)
    }

    if (!ymd) {
        const parsed = input instanceof Date ? input : new Date(input)
        if (Number.isNaN(parsed.getTime())) {
            return null
        }
        const parts = getDatePartsInTimeZone(parsed, normalizedTimeZone)
        ymd = { year: parts.year, month: parts.month, day: parts.day }
    }

    const start = zonedDateTimeToUtc(ymd.year, ymd.month, ymd.day, 0, 0, 0, 0, normalizedTimeZone)
    const nextDayUtc = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + 1, 0, 0, 0, 0))
    const nextDay = {
        year: nextDayUtc.getUTCFullYear(),
        month: nextDayUtc.getUTCMonth() + 1,
        day: nextDayUtc.getUTCDate(),
    }
    const nextDayStart = zonedDateTimeToUtc(
        nextDay.year,
        nextDay.month,
        nextDay.day,
        0,
        0,
        0,
        0,
        normalizedTimeZone,
    )
    const end = new Date(nextDayStart.getTime() - 1)

    return {
        start,
        end,
        dateKey: toYmd(ymd),
    }
}

export function getUtcRangeForCalendarMonth(
    year: number,
    month1to12: number,
    timeZone: string,
): { start: Date; end: Date } {
    const lastDay = new Date(Date.UTC(year, month1to12, 0)).getUTCDate()

    const first = getUtcRangeForCalendarDay(
        `${year}-${String(month1to12).padStart(2, '0')}-01`,
        timeZone,
    )
    const last = getUtcRangeForCalendarDay(
        `${year}-${String(month1to12).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        timeZone,
    )

    return {
        start: first?.start ?? new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0, 0)),
        end: last?.end ?? new Date(Date.UTC(year, month1to12 - 1, lastDay, 23, 59, 59, 999)),
    }
}

export function formatDateToYmdInTimeZone(value: string | Date, timeZone: string): string {
    const parsed = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(parsed.getTime())) {
        return ''
    }

    const parts = getDatePartsInTimeZone(parsed, normalizeTimeZone(timeZone))
    return toYmd({ year: parts.year, month: parts.month, day: parts.day })
}

export function getRollingWindowYmd(
    days: number,
    timeZone: string,
    anchorDate: Date = new Date(),
): { start: string; end: string } {
    const safeDays = Number.isFinite(days) ? Math.max(1, Math.trunc(days)) : 1
    const endDate = new Date(anchorDate)
    const startDate = new Date(anchorDate)
    startDate.setDate(startDate.getDate() - (safeDays - 1))

    return {
        start: formatDateToYmdInTimeZone(startDate, timeZone),
        end: formatDateToYmdInTimeZone(endDate, timeZone),
    }
}

export { DEFAULT_TIME_ZONE }
