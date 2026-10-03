import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db'
import { Tenant } from '@/models/Tenant'
import { generateMeritocracyPdf, isValidMeritocracyPdfPayload } from '@/services/pdf/meritocracy'

export async function POST(request: Request) {
    const session = await auth()

    if (!session?.user?.tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await connectDB()
        const tenant = await Tenant.findById(session.user.tenantId).select('name').lean()
        if (!tenant) {
            return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
        }

        const body: unknown = await request.json()
        if (!isValidMeritocracyPdfPayload(body)) {
            return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
        }

        const pdf = await generateMeritocracyPdf(body, {
            companyName: tenant.name,
            website: process.env.APP_BASE_URL ?? 'https://www.commission.com.br',
        })
        const pdfArrayBuffer = new ArrayBuffer(pdf.byteLength)
        new Uint8Array(pdfArrayBuffer).set(pdf)

        return new Response(pdfArrayBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="relatorio-meritocracia.pdf"',
            },
        })
    } catch (error) {
        console.error('Erro ao gerar PDF de meritocracia.', error)
        return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 })
    }
}
