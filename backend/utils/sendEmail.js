import { BrevoClient } from '@getbrevo/brevo';

const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const sendEmail = async ({ to, subject, html, text }) => {
    if (!process.env.BREVO_API_KEY) throw new Error('Missing BREVO_API_KEY');
    if (!process.env.EMAIL_FROM) throw new Error('Missing EMAIL_FROM');

    try {
        const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
        const data = await brevo.transactionalEmails.sendTransacEmail({
            subject,
            htmlContent: html,
            textContent: text,
            sender: {
                name: process.env.EMAIL_FROM_NAME || 'HazardWatch',
                email: process.env.EMAIL_FROM,
            },
            to: [{ email: to }],
        });
        console.log('[sendEmail] Email accepted:', { to, subject, messageId: data?.messageId });
        return data;
    } catch (error) {
        console.error('[sendEmail] Failed:', error.message);
        if (error.body) console.error('[sendEmail] Response:', error.body);
        throw error;
    }
};

export const sendPasswordResetCode = (email, code, name) => {
    const safeName = escapeHtml(name || 'there');
    const safeCode = escapeHtml(code);
    const subject = 'Your HazardWatch password reset code';
    const text = `Hi ${name || 'there'},\n\nYour password reset code is: ${code}. Enter this code on the website to reset your password.\n\nThis code expires in 15 minutes. If you did not request a password reset, you can ignore this email.`;
    const html = `
        <div style="margin:0;background:#f4f8fc;padding:32px 16px;font-family:Arial,sans-serif;color:#172b4d;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d8e4f0;border-radius:12px;overflow:hidden;">
                <div style="background:#1261a0;padding:24px 28px;color:#ffffff;">
                    <div style="font-size:22px;font-weight:700;">HazardWatch Dagupan</div>
                </div>
                <div style="padding:32px 28px;">
                    <p style="margin:0 0 16px;font-size:16px;">Hi ${safeName},</p>
                    <p style="margin:0 0 16px;line-height:1.6;">Your password reset code is shown below. Enter this code on the website to reset your password.</p>
                    <div style="margin:0 0 24px;padding:20px;text-align:center;background:#eaf4ff;border:1px solid #b8d9f7;border-radius:8px;">
                        <div style="margin-bottom:8px;color:#52708f;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Password reset code</div>
                        <div style="color:#1261a0;font-size:30px;font-weight:700;letter-spacing:5px;word-break:break-all;">${safeCode}</div>
                    </div>
                    <p style="margin:0;color:#52708f;font-size:14px;line-height:1.6;">This code expires in 15 minutes. If you did not request a password reset, you can ignore this email.</p>
                </div>
            </div>
        </div>`;

    return sendEmail({ to: email, subject, html, text });
};