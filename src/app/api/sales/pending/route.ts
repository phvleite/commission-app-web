import { auth } from '@/auth'
import { getUtcRangeForCalendarDay, resolveRequestTimeZone } from '@/lib/date-timezone'
import { generateCommissionsForDate } from '@/services/commissions/generate'
import { rollbackSaleAndCommissionsForDate } from '@/services/commissions/delete'
import { findPendingSale } from '@/services/sales/pending-sale'
import { CommissionProcess } from '@/models/CommissionProcess'
import { isDatabaseConnectionError } from '@/lib/api/db-errors'

function serializePendingSale(pending: NonNullable<Awaited<ReturnType<typeof findPendingSale>>>) {
    return {
        date: pending.date.toISOString(),
        value: pending.value,
        totalCommissionValue: pending.totalCommissionValue,
        status: pending.status,
        startedAt: pending.startedAt.toISOString(),
        recoverable: pending.recoverable,
    }
}

export async function GET() {
    const session = await auth()
    if (!session?.user?.tenantId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const pending = await findPendingSale(session.user.tenantId)
        return Response.json({ pending: pending ? serializePendingSale(pending) : null })
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            return Response.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return Response.json({ error: 'Erro ao consultar lançamento pendente.' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.tenantId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { action?: string; date?: string }
    if ((body.action !== 'complete' && body.action !== 'discard') || !body.date) {
        return Response.json({ error: 'Ação ou data inválida.' }, { status: 400 })
    }

    const timeZone = resolveRequestTimeZone(request, session.user.tenantTimeZone)
    const dayRange = getUtcRangeForCalendarDay(body.date, timeZone)
    if (!dayRange) {
        return Response.json({ error: 'Data inválida.' }, { status: 400 })
    }

    try {
        const pending = await findPendingSale(session.user.tenantId)
        if (!pending || pending.date.getTime() !== dayRange.start.getTime()) {
            return Response.json({ error: 'Lançamento pendente não encontrado.' }, { status: 404 })
        }

        if (!pending.recoverable) {
            return Response.json(
                { error: 'O lançamento ainda está sendo processado. Aguarde alguns instantes.' },
                { status: 409 },
            )
        }

        if (body.action === 'discard') {
            await rollbackSaleAndCommissionsForDate(session.user.tenantId, pending.date)
        } else {
            await CommissionProcess.findOneAndUpdate(
                { tenantId: session.user.tenantId, date: pending.date },
                {
                    $set: {
                        status: 'processing',
                        startedAt: new Date(),
                        finishedAt: undefined,
                        errorCode: undefined,
                        message: 'Reprocessamento solicitado pelo usuário.',
                    },
                },
                { upsert: true },
            )
            await generateCommissionsForDate(session.user.tenantId, pending.date)
        }

        return Response.json({ ok: true })
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            return Response.json(
                {
                    error: 'Falha de conexão com o banco de dados.',
                    errorCode: 'database_connection_lost',
                },
                { status: 503 },
            )
        }

        return Response.json({ error: 'Erro ao resolver lançamento pendente.' }, { status: 500 })
    }
}
