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
    subject: 'HazardWatch Resend API test',
    text: 'This is a test email from the HazardWatch Resend API configuration.',
    html: '<p>This is a test email from the HazardWatch Resend API configuration.</p>',
  });
  console.log('[testEmail] Email accepted successfully:', {
    to: recipient,
    id: info?.id,
  });
} catch (error) {
  console.error('[testEmail] Email failed:', {
    message: error.message,
    stack: error.stack,
  });
  process.exitCode = 1;
}