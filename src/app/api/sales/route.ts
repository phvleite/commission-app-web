import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Sale } from '@/models/Sale'
import { deleteCommissionsForDate } from '@/services/commissions/delete'
import { generateCommissionsForDate } from '@/services/commissions/generate'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'

interface SalesQuery {
    tenantId: string
    date?: {
        $gte?: Date
        $lte?: Date
    }
}

export async function GET(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const start = searchParams.get('start')
        const end = searchParams.get('end')
        const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)

        const query: SalesQuery = { tenantId: session.user.tenantId }

        if (start) {
            const startRange = getUtcRangeForCalendarDay(start, timeZone)
            if (!startRange) {
                return NextResponse.json({ error: 'Data inicial inválida.' }, { status: 400 })
            }
            query.date = { ...query.date, $gte: startRange.start }
        }

        if (end) {
            const endRange = getUtcRangeForCalendarDay(end, timeZone)
            if (!endRange) {
                return NextResponse.json({ error: 'Data final inválida.' }, { status: 400 })
            }
            query.date = { ...query.date, $lte: endRange.end }
        }

        const sales = await Sale.find(query).sort({ date: -1 }).lean()

        return NextResponse.json({ sales })
    } catch (error) {
        console.error('Erro ao buscar vendas.', error)
        return NextResponse.json({ sales: [], error: 'Erro ao buscar vendas.' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date, value } = await req.json()

    if (typeof date !== 'string') {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)
    const dayRange = getUtcRangeForCalendarDay(date, timeZone)
    if (!dayRange) {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const dateObj = dayRange.start
    const valueCentavos = Math.round(value * 100)
    const commissionCentavos = Math.round(valueCentavos * 0.1)

    try {
        const exists = await Sale.findOne({
            tenantId: session.user.tenantId,
            date: {
                $gte: dayRange.start,
                $lte: dayRange.end,
            },
        })

        if (exists) {
            return NextResponse.json(
                { error: 'Já existe uma venda registrada para esta data.' },
                { status: 400 },
            )
        }

        const createdSale = await Sale.create({
            tenantId: session.user.tenantId,
            date: dateObj,
            value: valueCentavos,
            totalCommissionValue: commissionCentavos,
        })

        try {
            await generateCommissionsForDate(session.user.tenantId, dateObj)
        } catch (error) {
            console.error('Falha ao gerar comissões para a venda.', error)
            await deleteCommissionsForDate(session.user.tenantId, dateObj)
            await Sale.deleteOne({ _id: createdSale._id })
            return NextResponse.json(
                { error: 'Erro ao processar a venda. A operação foi revertida.' },
                { status: 500 },
            )
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return NextResponse.json(
                { error: 'Já existe uma venda registrada para esta data.' },
                { status: 400 },
            )
        }

        console.error('Erro ao criar venda.', error)
        return NextResponse.json({ error: 'Erro ao criar venda.' }, { status: 500 })
    }
}
