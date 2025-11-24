import fetch from "node-fetch";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function parseFromField(fromValue?: string) {
  const fallbackEmail = process.env.SMTP_USER || "no-reply@crmlaunch.co.uk";
  if (!fromValue) {
    return { name: "CRM Launch", email: fallbackEmail };
  }

  const match = fromValue.match(/(.*)<(.+)>/);
  if (match && match[2]) {
    return { name: match[1].trim() || "CRM Launch", email: match[2].trim() };
  }

  return { name: fromValue.trim() || "CRM Launch", email: fallbackEmail };
}

export async function sendEmail(options: EmailOptions) {
  const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
  const { name, email } = parseFromField(process.env.MAIL_FROM);

  if (!apiKey) {
    console.warn("⚠️ Brevo API key not configured. Email will not be sent.", {
      to: options.to,
      subject: options.subject,
    });
    return { previewUrl: null };
  }

  const payload: Record<string, any> = {
    sender: { name, email },
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.html,
    textContent: options.text,
  };

  const replyToEmail = options.replyTo || process.env.SMTP_REPLY_TO || email;
  if (replyToEmail) {
    payload.replyTo = { email: replyToEmail };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("❌ Brevo email error:", response.status, errorBody);
    throw new Error(`Brevo email API error (${response.status})`);
  }

  return { previewUrl: null };
}

export async function sendVerificationEmail({
  to,
  code,
  expiresAt,
  verifyUrl,
  replyTo,
}: {
  to: string;
  code: string;
  expiresAt: Date;
  verifyUrl: string;
  replyTo?: string;
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
    replyTo,
  });
}

