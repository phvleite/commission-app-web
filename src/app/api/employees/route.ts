import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
import {
    sectorPercentageBlockedResponse,
    validateActiveSectorsPercentage,
} from '@/lib/api/business-rules'
import { Employee } from '@/models/Employee'
import { Sector } from '@/models/Sector'

export async function GET(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    await connectDB()

    const sectorsValidation = await validateActiveSectorsPercentage(user.tenantId)
    if (!sectorsValidation.valid) {
        return sectorPercentageBlockedResponse(sectorsValidation.total)
    }

    const employees = await Employee.find({
        tenantId: user.tenantId,
        ...(includeInactive ? {} : { active: true }),
    })
        .sort({ name: 1 })
        .lean()

    return Response.json({ data: employees })
}

export async function POST(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json({ error: 'Sem permissao para criar colaborador.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        name?: string
        sectorId?: string
        admissionDate?: string
        dismissalDate?: string
        active?: boolean
    }

    const name = body.name?.trim()
    const sectorId = body.sectorId
    const admissionDate = body.admissionDate

    if (!name || !sectorId || !admissionDate) {
        return Response.json(
            { error: 'name, sectorId e admissionDate sao obrigatorios.' },
            { status: 400 },
        )
    }

    if (!Types.ObjectId.isValid(sectorId)) {
        return Response.json({ error: 'sectorId invalido.' }, { status: 400 })
    }

    const admissionDateParsed = new Date(admissionDate)

    if (Number.isNaN(admissionDateParsed.getTime())) {
        return Response.json({ error: 'admissionDate invalida.' }, { status: 400 })
    }

    const dismissalDateParsed = body.dismissalDate ? new Date(body.dismissalDate) : undefined

    if (dismissalDateParsed && Number.isNaN(dismissalDateParsed.getTime())) {
        return Response.json({ error: 'dismissalDate invalida.' }, { status: 400 })
    }

    await connectDB()

    const sectorsValidation = await validateActiveSectorsPercentage(user.tenantId)
    if (!sectorsValidation.valid) {
        return sectorPercentageBlockedResponse(sectorsValidation.total)
    }

    const sector = await Sector.findOne({ _id: sectorId, tenantId: user.tenantId }).lean()

    if (!sector) {
        return Response.json({ error: 'Setor nao encontrado para este tenant.' }, { status: 404 })
    }

    if (sector.isMeritocracia) {
        return Response.json(
            { error: 'Setor de meritocracia nao pode ser vinculado a colaborador.' },
            { status: 400 },
        )
    }

    const employee = await Employee.create({
        tenantId: user.tenantId,
        name,
        sectorId,
        admissionDate: admissionDateParsed,
        dismissalDate: dismissalDateParsed,
        active: body.active ?? true,
    })

    return Response.json({ data: employee }, { status: 201 })
}
