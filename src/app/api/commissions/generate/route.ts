import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { generateCommissionsForDate } from '@/services/commissions/generate'

export async function POST(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date } = await req.json()

    await generateCommissionsForDate(session.user.tenantId, new Date(date))

    return NextResponse.json({ ok: true })
}
