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

export const sendEmailChangeCode = ({ email, name, code }) => {
    const safeName = escapeHtml(name || 'there');
    const safeCode = escapeHtml(code);
    const subject = 'HazardWatch — Verify your new email address';
    const text = `Hi ${name || 'there'},\n\nYour email change verification code is ${code}. Enter it in your HazardWatch profile to confirm this email address. The code expires in 15 minutes.`;
    const html = `
        <div style="margin:0;background:#f4f8fc;padding:32px 16px;font-family:Arial,sans-serif;color:#172b4d;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d8e4f0;border-radius:12px;overflow:hidden;">
                <div style="background:#1261a0;padding:24px 28px;color:#ffffff;font-size:22px;font-weight:700;">HazardWatch Dagupan</div>
                <div style="padding:32px 28px;">
                    <p>Hi ${safeName},</p>
                    <p>Use this code to confirm your new HazardWatch email address:</p>
                    <p style="font-size:30px;font-weight:700;letter-spacing:6px;color:#1261a0;">${safeCode}</p>
                    <p style="color:#52708f;">This code expires in 15 minutes. Your email will not change until it is verified.</p>
                </div>
            </div>
        </div>`;
    return sendEmail({ to: email, subject, html, text });
};

export const sendEmailChangeNotice = ({ email, name, newEmail }) => {
    const safeName = escapeHtml(name || 'there');
    const safeNewEmail = escapeHtml(newEmail);
    const subject = 'HazardWatch — Email change requested';
    const text = `Hi ${name || 'there'},\n\nA request was made to change your HazardWatch email address to ${newEmail}. The change will not take effect until that address is verified. If you did not make this request, secure your account immediately.`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172b4d"><h1>HazardWatch Dagupan</h1><p>Hi ${safeName},</p><p>A request was made to change your account email address to <strong>${safeNewEmail}</strong>.</p><p>The change will not take effect until the new address is verified. If you did not make this request, secure your account immediately.</p></div>`;
    return sendEmail({ to: email, subject, html, text });
};

export const sendEmailChangedConfirmation = ({ email, name }) => {
    const safeName = escapeHtml(name || 'there');
    const subject = 'HazardWatch — Email changed successfully';
    const text = `Hi ${name || 'there'},\n\nYour HazardWatch account email address was changed successfully. If you did not make this change, secure your account immediately.`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172b4d"><h1>HazardWatch Dagupan</h1><p>Hi ${safeName},</p><p>Your HazardWatch account email address was changed successfully.</p><p>If you did not make this change, secure your account immediately.</p></div>`;
    return sendEmail({ to: email, subject, html, text });
};

export const sendPasswordChangeCode = ({ email, name, code }) => {
    const safeName = escapeHtml(name || 'there');
    const safeCode = escapeHtml(code);
    const subject = 'HazardWatch — Password change verification code';
    const text = `Hi ${name || 'there'},\n\nYour password change verification code is ${code}. Enter it in your HazardWatch profile to confirm this change. The code expires in 15 minutes.`;
    const html = `
        <div style="margin:0;background:#f4f8fc;padding:32px 16px;font-family:Arial,sans-serif;color:#172b4d;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d8e4f0;border-radius:12px;overflow:hidden;">
                <div style="background:#1261a0;padding:24px 28px;color:#ffffff;font-size:22px;font-weight:700;">HazardWatch Dagupan</div>
                <div style="padding:32px 28px;">
                    <p>Hi ${safeName},</p>
                    <p>Use this code to verify your password change:</p>
                    <p style="font-size:30px;font-weight:700;letter-spacing:6px;color:#1261a0;">${safeCode}</p>
                    <p style="color:#52708f;">This code expires in 15 minutes. Your password will not change until it is verified.</p>
                </div>
            </div>
        </div>`;
    return sendEmail({ to: email, subject, html, text });
};

export const sendPasswordChangedConfirmation = ({ email, name, changedAt = new Date() }) => {
    const safeName = escapeHtml(name || 'there');
    const resetLink = `${appBaseUrl()}/forgot-password`;
    const changedTime = new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
    }).format(changedAt);
    const safeChangedTime = escapeHtml(`${changedTime} PHT`);
    const subject = 'HazardWatch — Your password was changed';
    const text = `Hi ${name || 'there'},\n\nYour HazardWatch password was changed on ${changedTime} PHT.\n\nIf you did not make this change, reset your password immediately: ${resetLink}`;
    const html = `
        <div style="margin:0;background:#f4f8fc;padding:32px 16px;font-family:Arial,sans-serif;color:#172b4d;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d8e4f0;border-radius:12px;overflow:hidden;">
                <div style="background:#1261a0;padding:24px 28px;color:#ffffff;font-size:22px;font-weight:700;">HazardWatch Dagupan</div>
                <div style="padding:32px 28px;">
                    <p>Hi ${safeName},</p>
                    <p>Your HazardWatch password was changed successfully.</p>
                    <p><strong>When:</strong> ${safeChangedTime}</p>
                    <p>If you did not make this change, reset your password immediately.</p>
                    <p><a href="${resetLink}" style="display:inline-block;padding:10px 18px;background:#1261a0;color:#ffffff;text-decoration:none;border-radius:8px;">Reset your password</a></p>
                </div>
            </div>
        </div>`;
    return sendEmail({ to: email, subject, html, text });
};

export const sendTwoFactorCode = ({ email, name, code }) => {
    const safeName = escapeHtml(name || 'there');
    const safeCode = escapeHtml(code);
    const subject = 'Your HazardWatch security code';
    const text = `Hi ${name || 'there'},\n\nYour HazardWatch security code is ${code}. It expires in 10 minutes. If you did not request this code, secure your account immediately.`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172b4d"><h1>HazardWatch Dagupan</h1><p>Hi ${safeName},</p><p>Use this one-time security code to continue:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px">${safeCode}</p><p>This code expires in 10 minutes.</p><p>If you did not request this code, secure your account immediately.</p></div>`;
    return sendEmail({ to: email, subject, html, text });
};

const appBaseUrl = () => (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://hazardwatch-dagupan.vercel.app').replace(/\/$/, '');

export const buildNewDeviceAlertEmail = ({ name, email, deviceName, ipAddress, sentAt }) => {
    const safeName = escapeHtml(name || 'there');
    const safeDeviceName = escapeHtml(deviceName || 'a new device');
    const safeIp = escapeHtml(ipAddress || 'unknown IP');
    const actionLink = `${appBaseUrl()}/forgot-password`;
    const safeTime = escapeHtml(sentAt ? new Date(sentAt).toLocaleString() : 'just now');
    const subject = 'HazardWatch — New device sign-in';
    const text = `Hi ${name || 'there'},\n\nWe detected a sign-in to your HazardWatch account from a new device at ${safeTime}.\n\nDevice: ${deviceName || 'Unrecognized device'}\nIP address: ${ipAddress || 'unknown IP'}\n\nIf this wasn’t you, reset your password immediately: ${actionLink}`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172b4d;">
            <div style="background-color:#1e40af;padding:20px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:26px;">HazardWatch Dagupan</h1>
            </div>
            <div style="padding:30px;background-color:#f9fafb;">
                <p>Hi ${safeName},</p>
                <p>We detected a new sign-in to your account on <strong>${safeTime}</strong>.</p>
                <div style="background:#ffffff;border:1px solid #dfe7f5;border-radius:10px;padding:18px;margin:20px 0;">
                    <p style="margin:0 0 8px;"><strong>Device:</strong> ${safeDeviceName}</p>
                    <p style="margin:0 0 8px;"><strong>IP address:</strong> ${safeIp}</p>
                    <p style="margin:0;"><strong>Approximate time:</strong> ${safeTime}</p>
                </div>
                <p>If this wasn’t you, please reset your password immediately to secure your account.</p>
                <p><a href="${actionLink}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">Reset your password</a></p>
            </div>
        </div>`;
    return { to: email, subject, html, text };
};

export const sendNewDeviceAlertEmail = ({ email, name, deviceName, ipAddress, sentAt }) => {
    const payload = buildNewDeviceAlertEmail({ name, email, deviceName, ipAddress, sentAt });
    return sendEmail({ to: payload.to, subject: payload.subject, html: payload.html, text: payload.text });
};

export const buildAccountVerifiedEmail = ({ name, email }) => {
    const safeName = escapeHtml(name || 'there');
    const signInLink = `${appBaseUrl()}/login`;
    const contactLink = `${appBaseUrl()}/contact`;
    const subject = 'HazardWatch — Account Verified';
    const text = `Hi ${name || 'there'},\n\nYour HazardWatch account is now verified and active.\n\nYou can sign in here: ${signInLink}\n\nIf you need support, visit: ${contactLink}`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172b4d;">
            <div style="background-color:#1e40af;padding:20px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:26px;">HazardWatch Dagupan</h1>
            </div>
            <div style="padding:30px;background-color:#f9fafb;">
                <p>Hi ${safeName},</p>
                <p>Your HazardWatch account is now verified and active.</p>
                <p>You're ready to sign in and continue reporting hazards in Dagupan.</p>
                <p><a href="${signInLink}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">Sign in</a></p>
                <p style="color:#4b5563;">Need help? <a href="${contactLink}" style="color:#2563eb;">Contact support</a></p>
            </div>
        </div>`;
    return { to: email, subject, html, text };
};

export const sendAccountVerifiedEmail = ({ email, name }) => {
    const payload = buildAccountVerifiedEmail({ name, email });
    return sendEmail({ to: payload.to, subject: payload.subject, html: payload.html, text: payload.text });
};