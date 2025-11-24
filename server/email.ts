import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporterPromise: Promise<nodemailer.Transporter | null> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    if (host && user && pass) {
      console.log("✉️ Using configured SMTP server for transactional emails");
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }

    if (process.env.NODE_ENV === "production") {
      console.warn("⚠️ SMTP credentials not configured. Email verification emails will be logged only.");
      return null;
    }

    const testAccount = await nodemailer.createTestAccount();
    console.log("✉️ Using Ethereal test account for dev emails:", testAccount.user);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  })();

  return transporterPromise;
}

export async function sendEmail(options: EmailOptions) {
  const transporter = await getTransporter();
  const from = process.env.MAIL_FROM || "CRM Launch <no-reply@crmlaunch.co.uk>";

  if (!transporter) {
    console.log("📨 Email transport not configured. Email content:", {
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
    return { previewUrl: null };
  }

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("📨 Preview email at:", previewUrl);
  }

  return { previewUrl };
}

export async function sendVerificationEmail({
  to,
  code,
  expiresAt,
  verifyUrl,
}: {
  to: string;
  code: string;
  expiresAt: Date;
  verifyUrl: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Verify your CRM Launch account</h2>
      <p>Use the verification code below to confirm your email address:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p>This code will expire at <strong>${expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.</p>
      <p>You can also verify your account by clicking the button below:</p>
      <p>
        <a href="${verifyUrl}" style="background-color: #1e40af; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify my email</a>
      </p>
      <p>If you didn't create this account, you can safely ignore this email.</p>
      <p>Thank you,<br/>CRM Launch Team</p>
    </div>
  `;

  const text = `
Verify your CRM Launch account

Your verification code: ${code}
This code expires at ${expiresAt.toISOString()}.

Or click this link: ${verifyUrl}

If you didn't create this account, you can ignore this email.
  `.trim();

  await sendEmail({
    to,
    subject: "Verify your CRM Launch account",
    html,
    text,
  });
}

