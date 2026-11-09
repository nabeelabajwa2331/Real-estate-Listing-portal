// Sends a test email using the SMTP settings in .env, so you can confirm delivery.
// Usage: npm run test-email -- you@example.com
// (Defaults to SMTP_USER when no address is given.)
import 'dotenv/config';
import sendEmail from '../utils/sendEmail.js';

const to = process.argv[2] || process.env.SMTP_USER;

if (!to) {
  console.error('Usage: npm run test-email -- you@example.com');
  process.exit(1);
}

if (!process.env.SMTP_HOST) {
  console.error('SMTP_HOST is empty in server/.env — no real email will be sent.');
  console.error('Fill SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS first.');
  process.exit(1);
}

try {
  await sendEmail({
    to,
    subject: 'Real Estate — SMTP test',
    text: 'If you received this, your email (SMTP) settings work correctly.',
  });
  console.log(`Test email sent to ${to}. Check the inbox (and the Spam folder).`);
} catch (err) {
  console.error('Send failed:', err.message);
  process.exit(1);
}
