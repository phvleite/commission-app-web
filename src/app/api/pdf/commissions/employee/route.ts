import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'
import { generateEmployeePeriodTitle } from '@/app/dashboard/commissions/utils/generateEmployeePeriodTitle'
import { MeritocracyAllocation, type IMeritocracyRecipient } from '@/models/MeritocracyAllocation'
import { Tenant } from '@/models/Tenant'
import {
    generateCommissionEmployeePdf,
    isValidCommissionEmployeePdfPayload,
} from '@/services/pdf/commissions-employee'

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
        if (!isValidCommissionEmployeePdfPayload(body)) {
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

        let meritocracyEntries: {
            date: Date
            employeeName: string
            sectorName: string
            employeeValue: number
        }[] = []
        if (body.employeeId) {
            const allocations = await MeritocracyAllocation.find({
                tenantId: session.user.tenantId,
                status: 'success',
                paymentDate: { $gte: reportStartRange.start, $lte: reportEndRange.end },
                'recipients.employeeId': body.employeeId,
            })
                .select('recipients paymentDate')
                .lean()

            meritocracyEntries = allocations.flatMap((allocation) =>
                allocation.recipients
                    .filter(
                        (recipient: IMeritocracyRecipient) =>
                            String(recipient.employeeId) === body.employeeId,
                    )
                    .map((recipient: IMeritocracyRecipient) => ({
                        date: allocation.paymentDate,
                        employeeName: recipient.employeeName,
                        sectorName: 'MERITOCRACIA',
                        employeeValue: recipient.employeeValue,
                    })),
            )
        }

        const meritocracyValue = meritocracyEntries.reduce(
            (total, entry) => total + entry.employeeValue,
            0,
        )
        const employeeName =
            body.data[0]?.employeeName ?? meritocracyEntries[0]?.employeeName ?? 'COLABORADOR'
        const title = generateEmployeePeriodTitle(
            employeeName.toUpperCase(),
            body.startDate,
            body.endDate,
        )
        const pdf = await generateCommissionEmployeePdf({
            title,
            payload: body,
            meritocracyValue,
            meritocracyEntries,
            companyName: tenant.name,
            website: process.env.APP_BASE_URL ?? 'https://www.commission.com.br',
        })
        const pdfArrayBuffer = new ArrayBuffer(pdf.byteLength)
        new Uint8Array(pdfArrayBuffer).set(pdf)
        const filename = `relatorio-colaborador-${getFilenameTimestamp()}.pdf`

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
