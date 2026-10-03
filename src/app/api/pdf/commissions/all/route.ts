import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'
import { MeritocracyAllocation } from '@/models/MeritocracyAllocation'
import { Tenant } from '@/models/Tenant'
import { generatePeriodTitle } from '@/app/dashboard/commissions/utils/generatePeriodTitle'
import {
    generateCommissionAllPdf,
    isValidCommissionAllPdfPayload,
} from '@/services/pdf/commissions-all'

export const runtime = 'nodejs'

function getFilenameTimestamp(date = new Date()): string {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')

    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const tenant = await Tenant.findById(session.user.tenantId).select('name').lean()
        if (!tenant) {
            return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
        }

        const body: unknown = await request.json()
        if (!isValidCommissionAllPdfPayload(body)) {
            return NextResponse.json(
                { error: 'Payload inválido para geração de PDF.' },
                { status: 400 },
            )
        }

        const timeZone = resolveRequestTimeZone(request, session.user.tenantTimeZone)
        const reportStartRange = getUtcRangeForCalendarDay(body.startDate, timeZone)
        const reportEndRange = getUtcRangeForCalendarDay(body.endDate, timeZone)
        if (!reportStartRange || !reportEndRange) {
            return NextResponse.json(
                { error: 'Período inválido para geração de PDF.' },
                { status: 400 },
            )
        }

        const meritocracyAllocations = await MeritocracyAllocation.find({
            tenantId: session.user.tenantId,
            status: 'success',
            paymentDate: { $gte: reportStartRange.start, $lte: reportEndRange.end },
        })
            .select('totalMeritocracyValue')
            .lean()
        const meritocracyTotal = meritocracyAllocations.reduce(
            (total, allocation) => total + allocation.totalMeritocracyValue,
            0,
        )

        const pdf = await generateCommissionAllPdf({
            title: generatePeriodTitle(body.startDate, body.endDate),
            payload: body,
            meritocracyTotal,
            companyName: tenant.name,
            website: process.env.APP_BASE_URL ?? 'https://www.commission.com.br',
        })
        const pdfArrayBuffer = new ArrayBuffer(pdf.byteLength)
        new Uint8Array(pdfArrayBuffer).set(pdf)
        const filename = `relatorio-geral-${getFilenameTimestamp()}.pdf`

        return new Response(pdfArrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 })
    }
}
