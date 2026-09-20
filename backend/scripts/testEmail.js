import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url) });
const { sendEmail } = await import('../utils/sendEmail.js');

const recipient = process.env.EMAIL_TEST_TO || process.env.EMAIL_FROM;

if (!recipient) {
  throw new Error('EMAIL_TEST_TO or EMAIL_FROM is required to run the email test.');
}

try {
  const info = await sendEmail({
    to: recipient,
    subject: 'HazardWatch Brevo API test',
    text: 'This is a test email from the HazardWatch Brevo API configuration.',
    html: '<p>This is a test email from the HazardWatch Brevo API configuration.</p>',
  });
  console.log('[testEmail] Email accepted successfully:', {
    to: recipient,
    messageId: info?.messageId,
  });
} catch (error) {
  console.error('[testEmail] Email failed:', {
    message: error.message,
    stack: error.stack,
  });
  process.exitCode = 1;
}