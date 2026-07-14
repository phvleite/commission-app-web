import { connectDB } from '@/lib/db'
import { canWrite, getRouteSessionUser } from '@/lib/api/route-auth'
import { ensureMeritocraciaSector } from '@/lib/api/business-rules'
import { Sector } from '@/models/Sector'

export async function GET(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    await connectDB()
    await ensureMeritocraciaSector(user.tenantId)

    const sectors = await Sector.find({
        tenantId: user.tenantId,
        ...(includeInactive ? {} : { active: true }),
    })
        .sort({ name: 1 })
        .lean()

    return Response.json({ data: sectors })
}

export async function POST(request: Request) {
    const user = await getRouteSessionUser()

    if (!user) {
        return Response.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    if (!canWrite(user.role)) {
        return Response.json({ error: 'Sem permissao para criar setor.' }, { status: 403 })
    }

    const body = (await request.json()) as {
        name?: string
        percentage?: number
        isMeritocracia?: boolean
    }

    const name = body.name?.trim()
    const percentage = body.percentage

    if (!name || typeof percentage !== 'number') {
        return Response.json({ error: 'name e percentage sao obrigatorios.' }, { status: 400 })
    }

    if (percentage < 0 || percentage > 100) {
        return Response.json({ error: 'percentage deve estar entre 0 e 100.' }, { status: 400 })
    }

    await connectDB()

    try {
        const sector = await Sector.create({
            tenantId: user.tenantId,
            name,
            percentage,
            isMeritocracia: Boolean(body.isMeritocracia),
        })

        return Response.json({ data: sector }, { status: 201 })
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: number }).code === 11000
        ) {
            return Response.json(
                { error: 'Setor com este nome ja existe no tenant.' },
                { status: 409 },
            )
        }

        return Response.json({ error: 'Nao foi possivel criar o setor.' }, { status: 500 })
    }
}
