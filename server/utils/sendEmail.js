import nodemailer from 'nodemailer';

let smtpTransport;
let testTransport;

function getSmtpTransport() {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return smtpTransport;
}

async function getTestTransport() {
  if (!testTransport) {
    const account = await nodemailer.createTestAccount();
    testTransport = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    console.log(`\n--- Development mail catcher ready: ${account.user} ---\n`);
  }
  return testTransport;
}

export default async function sendEmail({ to, subject, text }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';

  if (process.env.SMTP_HOST) {
    await getSmtpTransport().sendMail({ from, to, subject, text });
    return;
  }

  // Production must have SMTP; never silently fall back to printing.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SMTP is not configured; refusing to pretend an email was sent');
  }

  if ((process.env.EMAIL_TRANSPORT || 'ethereal') !== 'console') {
    try {
      const transport = await getTestTransport();
      const info = await transport.sendMail({ from, to, subject, text });
      console.log('\n--- EMAIL (Ethereal test inbox) ---');
      console.log(`To: ${to}\nSubject: ${subject}`);
      console.log(`Preview: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('----------------------------------\n');
      return;
    } catch (err) {
      console.error('Ethereal email failed, printing instead:', err.message);
    }
  }

  console.log('\n--- EMAIL (SMTP not configured, printed instead) ---');
  console.log(`To: ${to}\nSubject: ${subject}\n\n${text}`);
  console.log('----------------------------------------------------\n');
}
