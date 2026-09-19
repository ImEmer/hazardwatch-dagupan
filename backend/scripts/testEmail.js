import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url) });
const { sendEmail } = await import('../utils/sendEmail.js');

const recipient = process.env.EMAIL_USER;

if (!recipient) {
  throw new Error('EMAIL_USER is required to run the email test.');
}

try {
  const info = await sendEmail({
    to: recipient,
    subject: 'HazardWatch SMTP IPv4 test',
    text: 'This is a test email from the HazardWatch SMTP configuration.',
    html: '<p>This is a test email from the HazardWatch SMTP configuration.</p>',
  });
  console.log('[testEmail] Email sent successfully:', info.response || info.messageId);
} catch (error) {
  console.error('[testEmail] Email failed:', error.message);
  process.exitCode = 1;
}