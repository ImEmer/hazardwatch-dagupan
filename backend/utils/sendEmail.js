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
        console.log('[sendEmail] Email accepted:', { to, subject, messageId: data?.messageId, response: data });
        return data;
    } catch (error) {
        console.error('[sendEmail] Failed:', { to, subject, message: error.message, body: error.body, stack: error.stack });
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

export const sendVerificationEmail = ({ email, name, code }) => {
    const safeName = escapeHtml(name || 'there');
    const safeCode = escapeHtml(code);
    const subject = 'Verify your HazardWatch account';
    const text = `HazardWatch Dagupan\n\nHi ${name || 'there'},\n\nThanks for creating your HazardWatch account. Enter this code to verify your email: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not register, please ignore this email.`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172b4d;">
            <div style="background-color:#1e40af;padding:20px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;">HazardWatch Dagupan</h1>
            </div>
            <div style="padding:30px;background-color:#f9fafb;">
                <p>Hi ${safeName},</p>
                <p>Thanks for creating your HazardWatch account. Enter this code to verify your email:</p>
                <div style="text-align:center;margin:30px 0;">
                    <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af;padding:20px;background-color:#ffffff;border:2px dashed #1e40af;border-radius:8px;display:inline-block;">${safeCode}</div>
                </div>
                <p style="color:#ef4444;font-weight:bold;">This code expires in 15 minutes.</p>
                <p style="color:#6b7280;font-size:14px;">If you did not register, please ignore this email.</p>
            </div>
        </div>`;

    return sendEmail({ to: email, subject, html, text });
};