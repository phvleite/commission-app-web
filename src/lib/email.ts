import nodemailer from 'nodemailer'

interface SendSignupConfirmationEmailInput {
    to: string
    code: string
    adminName: string
    companyName: string
}

function getOptionalEnv(name: string): string | undefined {
    const value = process.env[name]?.trim()
    return value ? value : undefined
}

function normalizeBaseUrl(value: string): string {
    return value.endsWith('/') ? value.slice(0, -1) : value
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export async function sendSignupConfirmationEmail({
    to,
    code,
    adminName,
    companyName,
}: SendSignupConfirmationEmailInput): Promise<void> {
    const host = getOptionalEnv('SMTP_HOST')
    const port = Number(getOptionalEnv('SMTP_PORT') ?? '587')
    const user = getOptionalEnv('SMTP_USER')
    const pass = getOptionalEnv('SMTP_PASSWORD')
    const from = getOptionalEnv('SMTP_FROM') ?? 'Commission <contato@commission.com.br>'
    const secure = getOptionalEnv('SMTP_SECURE') === 'true'
    const appBaseUrl =
        getOptionalEnv('APP_BASE_URL') ?? getOptionalEnv('NEXT_PUBLIC_APP_URL') ?? undefined
    const logoUrl =
        getOptionalEnv('SMTP_LOGO_URL') ??
        (appBaseUrl
            ? `${normalizeBaseUrl(appBaseUrl)}/logo-commission-star-img.png`
            : undefined)

    if (!host || !user || !pass || !from) {
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
            console.info(
                `[signup-confirmation] code for ${to}: ${code} (company=${companyName}, admin=${adminName})`,
            )
            return
        }

        throw new Error(
            'SMTP nao configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD e SMTP_FROM.',
        )
    }

    const transport = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    })

    const subject = 'Confirme seu cadastro na Commission'
    const text = [
        `Olá, ${adminName}.`,
        '',
        `Recebemos um pedido de cadastro para ${companyName}.`,
        `Seu código de confirmação é: ${code}`,
        '',
        'Esse código expira em 15 minutos.',
        'Se não encontrar esta mensagem, verifique também a lixeira eletrônica e a pasta de spam.',
        'Se você não solicitou esse cadastro, ignore este e-mail.',
    ].join('\n')

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0a1a2f;">
            ${
                logoUrl
                    ? `<p style="margin: 0 0 16px;"><img src="${escapeHtml(logoUrl)}" alt="Commission" style="max-width: 220px; width: 100%; height: auto; display: block;" /></p>`
                    : ''
            }
            <h2 style="margin: 0 0 16px;">Confirme seu cadastro</h2>
            <p>Olá, ${escapeHtml(adminName)}.</p>
            <p>Recebemos um pedido de cadastro para <strong>${escapeHtml(companyName)}</strong>.</p>
            <p style="font-size: 18px; font-weight: 700; letter-spacing: 0.2em; background: #f5f7fa; padding: 12px 16px; display: inline-block; border-radius: 12px;">
                ${code}
            </p>
            <p>Esse código expira em 15 minutos.</p>
            <p>Se não encontrar esta mensagem, verifique também a lixeira eletrônica e a pasta de spam.</p>
            <p>Se você não solicitou esse cadastro, ignore este e-mail.</p>
        </div>
    `

    await transport.sendMail({
        from,
        to,
        subject,
        text,
        html,
    })
}
