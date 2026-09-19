    import nodemailer from 'nodemailer';

    const createTransporter = () => nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    });

    const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

    export const sendEmail = async ({ to, subject, html, text }) => {
    const info = await createTransporter().sendMail({
        from: process.env.EMAIL_FROM_NAME
        ? `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`
        : process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text,
    });

    console.log(`Email sent to ${to} with subject "${subject}" at ${new Date().toISOString()}`);
    return info;
    };

    export const sendPasswordResetCode = (email, code, name) => {
    const safeName = escapeHtml(name || 'there');
    const safeCode = escapeHtml(code);
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${encodeURIComponent(code)}`;
    const safeResetUrl = escapeHtml(resetUrl);
    const subject = 'Your HazardWatch password reset code';
    const text = `Hi ${name || 'there'},\n\nYour HazardWatch password reset code is:\n\n${code}\n\nReset your password: ${resetUrl}\n\nThis code expires in 15 minutes. If you did not request a password reset, you can ignore this email.`;
    const html = `
        <div style="margin:0;background:#f4f8fc;padding:32px 16px;font-family:Arial,sans-serif;color:#172b4d;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d8e4f0;border-radius:12px;overflow:hidden;">
            <div style="background:#1261a0;padding:24px 28px;color:#ffffff;">
            <div style="font-size:22px;font-weight:700;">HazardWatch Dagupan</div>
            </div>
            <div style="padding:32px 28px;">
            <p style="margin:0 0 16px;font-size:16px;">Hi ${safeName},</p>
            <p style="margin:0 0 24px;line-height:1.6;">Use the reset code below to create a new HazardWatch password.</p>
            <div style="margin:0 0 24px;padding:20px;text-align:center;background:#eaf4ff;border:1px solid #b8d9f7;border-radius:8px;">
                <div style="margin-bottom:8px;color:#52708f;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Password reset code</div>
                <div style="color:#1261a0;font-size:30px;font-weight:700;letter-spacing:5px;word-break:break-all;">${safeCode}</div>
            </div>
            <p style="margin:0 0 24px;text-align:center;"><a href="${safeResetUrl}" style="display:inline-block;background:#1261a0;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Reset your password</a></p>
            <p style="margin:0;color:#52708f;font-size:14px;line-height:1.6;">This code expires in 15 minutes. If you did not request a password reset, you can ignore this email.</p>
            </div>
        </div>
        </div>`;

    return sendEmail({ to: email, subject, html, text });
    };