import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Sale } from '@/models/Sale'
import { deleteCommissionsForDate } from '@/services/commissions/delete'
import { generateCommissionsForDate } from '@/services/commissions/generate'

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sale = await Sale.findOne({
        _id: params.id,
        tenantId: session.user.tenantId,
    }).lean()

    if (!sale) {
        return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ sale })
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date, value } = await req.json()

    const newDate = new Date(date)
    const newValueCentavos = Math.round(value * 100)
    const newCommissionCentavos = Math.round(newValueCentavos * 0.1)

    const sale = await Sale.findOne({
        _id: params.id,
        tenantId: session.user.tenantId,
    })

    if (!sale) {
        return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 })
    }

    const oldDate = sale.date

    // Verificar duplicidade
    const exists = await Sale.findOne({
        tenantId: session.user.tenantId,
        date: newDate,
        _id: { $ne: params.id },
    })

    if (exists) {
        return NextResponse.json(
            { error: 'Já existe uma venda registrada para esta data.' },
            { status: 400 }
        )
    }

    // Se a data mudou, apagar comissões antigas
    if (oldDate.getTime() !== newDate.getTime()) {
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
