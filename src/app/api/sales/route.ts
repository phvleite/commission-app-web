import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Sale } from '@/models/Sale'
import { generateCommissionsForDate } from '@/services/commissions/generate'

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

    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const query: SalesQuery = { tenantId: session.user.tenantId }

    if (start) query.date = { ...query.date, $gte: new Date(start) }
    if (end) query.date = { ...query.date, $lte: new Date(end) }

    const sales = await Sale.find(query).sort({ date: -1 }).lean()

    return NextResponse.json({ sales })
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date, value } = await req.json()

    const dateObj = new Date(date)
    const valueCentavos = Math.round(value * 100)
    const commissionCentavos = Math.round(valueCentavos * 0.1)

    // Verificar duplicidade
    const exists = await Sale.findOne({
        tenantId: session.user.tenantId,
        date: dateObj,
    })

    if (exists) {
        return NextResponse.json(
            { error: 'Já existe uma venda registrada para esta data.' },
            { status: 400 },
        )
    }

    // Criar venda
    await Sale.create({
        tenantId: session.user.tenantId,
        date: dateObj,
        value: valueCentavos,
        totalCommissionValue: commissionCentavos,
    })

    // Gerar comissões
    await generateCommissionsForDate(session.user.tenantId, dateObj)

    return NextResponse.json({ ok: true })
}
