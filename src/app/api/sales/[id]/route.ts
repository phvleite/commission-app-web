import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Sale } from '@/models/Sale'
import { Commission } from '@/models/Commission'
import { CommissionProcess } from '@/models/CommissionProcess'
import { SaleCommissionSector } from '@/models/SaleCommissionSector'
import {
    deleteCommissionsForDate,
    rollbackSaleAndCommissionsForDate,
} from '@/services/commissions/delete'
import { generateCommissionsForDate } from '@/services/commissions/generate'
import { Types } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'
import { findPendingSale } from '@/services/sales/pending-sale'

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

    try {
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
        } catch (error) {
            if (isDatabaseConnectionError(error)) {
                return NextResponse.json(
                    {
                        error: 'Falha de conexão com o banco de dados.',
                        errorCode: 'database_connection_lost',
                    },
                    { status: 503 },
                )
            }

            return NextResponse.json({ error: 'Erro ao buscar venda' }, { status: 500 })
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            return NextResponse.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

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

    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(req, session.user.tenantTimeZone)
    const dayRange = getUtcRangeForCalendarDay(date, timeZone)
    if (!dayRange) {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const newDate = dayRange.start
    const newValueCentavos = Math.round(value * 100)
    const newCommissionCentavos = Math.round(newValueCentavos * 0.1)

    try {
        await connectDB()

        const pending = await findPendingSale(session.user.tenantId)
        if (pending) {
            return NextResponse.json(
                {
                    error: pending.recoverable
                        ? 'Existe um lançamento anterior pendente de decisão.'
                        : 'Existe um lançamento de venda ainda em processamento.',
                    errorCode: 'pending_sale_recovery',
                    pending: {
                        date: pending.date.toISOString(),
                        value: pending.value,
                        status: pending.status,
                        recoverable: pending.recoverable,
                    },
                },
                { status: 409 },
            )
        }

        const sale = await Sale.findOne({
            _id: id,
            tenantId: session.user.tenantId,
        })

        if (!sale) {
            return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 })
        }

        const oldDate = sale.date
        const oldSaleValues = {
            date: sale.date,
            value: sale.value,
            totalCommissionValue: sale.totalCommissionValue,
        }

        const [oldCommissions, oldSectorSnapshots, oldProcess] = await Promise.all([
            Commission.find({ tenantId: session.user.tenantId, date: oldDate }).lean(),
            SaleCommissionSector.find({ tenantId: session.user.tenantId, date: oldDate }).lean(),
            CommissionProcess.findOne({ tenantId: session.user.tenantId, date: oldDate }).lean(),
        ])

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

        try {
            const oldDateStart = getUtcDayStartFromDate(oldDate)
            if (oldDateStart.getTime() !== newDate.getTime()) {
                await deleteCommissionsForDate(session.user.tenantId, oldDate)
            }

            sale.date = newDate
            sale.value = newValueCentavos
            sale.totalCommissionValue = newCommissionCentavos
            await sale.save()

            await generateCommissionsForDate(session.user.tenantId, newDate)
        } catch (error) {
            await rollbackSaleAndCommissionsForDate(session.user.tenantId, newDate)

            await Sale.findOneAndUpdate(
                { _id: sale._id, tenantId: session.user.tenantId },
                {
                    $set: {
                        date: oldSaleValues.date,
                        value: oldSaleValues.value,
                        totalCommissionValue: oldSaleValues.totalCommissionValue,
                    },
                },
                { upsert: true, returnDocument: 'after' },
            )

            if (oldCommissions.length > 0) {
                await Commission.insertMany(oldCommissions, { ordered: false })
            }
            if (oldSectorSnapshots.length > 0) {
                await SaleCommissionSector.insertMany(oldSectorSnapshots, { ordered: false })
            }
            if (oldProcess) {
                await CommissionProcess.create(oldProcess)
            }

            throw error
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            return NextResponse.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return NextResponse.json({ error: 'Erro ao atualizar venda' }, { status: 500 })
    }
}
