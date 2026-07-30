import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Sale } from '@/models/Sale'
import { deleteCommissionsForDate } from '@/services/commissions/delete'
import { generateCommissionsForDate } from '@/services/commissions/generate'
import { Types } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'

interface RouteContext {
    params: Promise<{ id: string }>
}

function getUtcDayStartFromDate(date: Date): Date {
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
    )
}

function serializeSale(sale: {
    _id: unknown
    date: Date
    value: number
    totalCommissionValue: number
}) {
    return {
        _id: String(sale._id),
        date: sale.date.toISOString(),
        value: sale.value,
        totalCommissionValue: sale.totalCommissionValue,
    }
}

export async function GET(_req: NextRequest, context: RouteContext) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'ID de venda inválido.' }, { status: 400 })
    }

    await connectDB()

    try {
        const sale = await Sale.findOne({
            _id: id,
            tenantId: session.user.tenantId,
        }).lean()

        if (!sale) {
            return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
        }

        return NextResponse.json({ sale: serializeSale(sale) })
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar venda' }, { status: 500 })
    }
}

export async function PUT(req: Request, context: RouteContext) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'ID de venda inválido.' }, { status: 400 })
    }

    const { date, value } = await req.json()

    if (typeof date !== 'string') {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)
    const dayRange = getUtcRangeForCalendarDay(date, timeZone)
    if (!dayRange) {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const newDate = dayRange.start
    const newValueCentavos = Math.round(value * 100)
    const newCommissionCentavos = Math.round(newValueCentavos * 0.1)

    await connectDB()

    const sale = await Sale.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!sale) {
        return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 })
    }

    const oldDate = sale.date

    // Verificar duplicidade
    const exists = await Sale.findOne({
        tenantId: session.user.tenantId,
        date: {
            $gte: dayRange.start,
            $lte: dayRange.end,
        },
        _id: { $ne: id },
    })

    if (exists) {
        return NextResponse.json(
            { error: 'Já existe uma venda registrada para esta data.' },
            { status: 400 },
        )
    }

    // Se a data mudou, apagar comissões antigas
    const oldDateStart = getUtcDayStartFromDate(oldDate)
    if (oldDateStart.getTime() !== newDate.getTime()) {
        await deleteCommissionsForDate(session.user.tenantId, oldDate)
    }

    // Atualizar venda
    sale.date = newDate
    sale.value = newValueCentavos
    sale.totalCommissionValue = newCommissionCentavos
    await sale.save()

    // Gerar comissões novas
    await generateCommissionsForDate(session.user.tenantId, newDate)

    return NextResponse.json({ ok: true })
}
