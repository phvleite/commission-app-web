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
        (appBaseUrl ? `${normalizeBaseUrl(appBaseUrl)}/logo-commission-star-img.png` : undefined)

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
        <div style="margin: 0; padding: 24px 12px; background: #f5f7fa; font-family: Arial, sans-serif; color: #0a1a2f;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 680px; margin: 0 auto; border-collapse: separate; border-spacing: 0;">
                <tr>
                    <td style="background: linear-gradient(160deg, #0a1a2f, #12395b); border: 1px solid #d7dee8; border-bottom: 0; border-radius: 16px 16px 0 0; padding: 28px 24px; text-align: center;">
                        ${
                            logoUrl
                                ? `<p style="margin: 0 0 16px;"><img src="${escapeHtml(logoUrl)}" alt="Commission" style="max-width: 230px; width: 100%; height: auto; display: inline-block;" /></p>`
                                : ''
                        }
                        <p style="margin: 0; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #a9d2eb; font-weight: 700;">Confirmação de cadastro</p>
                        <h1 style="margin: 12px 0 0; font-size: 32px; line-height: 1.2; color: #d4af37;">Confirme seu cadastro</h1>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; border: 1px solid #d7dee8; border-radius: 0 0 16px 16px; padding: 28px 24px 18px; box-shadow: 0 10px 18px rgba(20, 26, 47, 0.08);">
                        <p style="margin: 0 0 12px; font-size: 30px; line-height: 1.7;">Olá, ${escapeHtml(adminName)}.</p>
                        <p style="margin: 0 0 18px; font-size: 20px; line-height: 1.7;">Recebemos um pedido de cadastro para <strong>${escapeHtml(companyName)}</strong>.</p>

                        <div style="margin: 20px 0 22px; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #5f7083; font-weight: 700;">Código de confirmação</p>
                            <div style="display: inline-block; background: #eef4fa; border: 1px solid #d7dee8; border-radius: 14px; padding: 14px 20px; box-shadow: 0 8px 20px rgba(20, 26, 47, 0.08);">
                                <span style="font-size: 30px; letter-spacing: 0.35em; font-weight: 700; color: #0a1a2f;">${escapeHtml(code)}</span>
                            </div>
                        </div>

                        <div style="margin: 0 0 18px; border: 1px solid #d7dee8; border-radius: 12px; background: #f8fbfe; padding: 14px 14px 12px;">
                            <div style="border-left: 4px solid #d4af37; padding-left: 10px; margin: 0 0 10px; font-size: 14px; line-height: 1.4; font-weight: 700; color: #0a1a2f;">Orientações importantes</div>
                            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #5f7083;">Esse código expira em <strong style="color: #0a1a2f;">15 minutos</strong>.</p>
                            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #5f7083;">Se não encontrar esta mensagem, verifique também a lixeira eletrônica e a pasta de spam.</p>
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #5f7083;">Se você não solicitou esse cadastro, ignore este e-mail.</p>
                        </div>

                        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7a8798; text-align: center;">Commission • Sistema de gestão de gorjetas</p>
                    </td>
                </tr>
            </table>
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
