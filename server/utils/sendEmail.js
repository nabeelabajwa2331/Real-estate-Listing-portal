import nodemailer from 'nodemailer';

let smtpTransport;
let testTransport;

// Real delivery, used when SMTP_* is configured.
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

// A throwaway Ethereal inbox for development. Lazily created and cached.
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

  // 1. Real delivery.
  if (process.env.SMTP_HOST) {
    await getSmtpTransport().sendMail({ from, to, subject, text });
    return;
  }

  // 2. Development: capture in an Ethereal inbox and print a preview link.
  //    Set EMAIL_TRANSPORT=console to skip this and just print the message.
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

  // 3. Last resort: print to the terminal.
  console.log('\n--- EMAIL (SMTP not configured, printed instead) ---');
  console.log(`To: ${to}\nSubject: ${subject}\n\n${text}`);
  console.log('----------------------------------------------------\n');
}
