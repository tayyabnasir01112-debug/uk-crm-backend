# Email Verification Setup

To send verification emails from CRM Launch you only need a basic SMTP inbox (Gmail, Outlook, Brevo, Zoho, etc.). No paid services are requiredâ€”any provider that exposes SMTP credentials works.

## Environment variables (server)
Add the following to your backend `.env` / Render environment:

```
SMTP_HOST=smtp.gmail.com          # or smtp.zoho.com, smtp-relay.sendinblue.com, etc.
SMTP_PORT=587                     # 465 for SSL, 587 for STARTTLS
SMTP_SECURE=false                 # true if you use port 465
SMTP_USER=you@example.com         # mailbox username / address
SMTP_PASS=app-password-or-smtp-key
MAIL_FROM="CRM Launch <no-reply@crmlaunch.co.uk>"
PUBLIC_APP_URL=https://crmlaunch.co.uk   # used for links in the email
VERIFICATION_TTL_MINUTES=60             # optional, defaults to 60 minutes
```

### Gmail / Outlook quick start
1. Enable 2FA on the mailbox.
2. Create an **App Password** (Gmail) or **App password** (Outlook) and use it as `SMTP_PASS`.
3. Use `smtp.gmail.com` (587, STARTTLS) or `smtp.office365.com` (587, STARTTLS).

### Zoho / Brevo (Sendinblue)
- Both offer free SMTP plans. Generate an SMTP key and plug it into `SMTP_PASS`.

## How it works
- Every new signup gets a 6-digit code + secure link that expires after `VERIFICATION_TTL_MINUTES`.
- Users must verify before logging in or re-starting a new trial, preventing fake email churn.
- If SMTP variables are missing in development, emails are logged to the console instead so you can still test locally.

## Deployment steps
1. Add the env variables above to Render (backend) and Netlify (if you proxy through functions).
2. Redeploy the backend so the new variables are available.
3. Visit `/login?signup=true`, create a test account, and confirm that the verification email arrives.
4. In Google Search Console or analytics, you can now track confirmed accounts only.

> Tip: keep `MAIL_FROM` aligned with your domain to avoid spam filters (configure SPF/DKIM with your DNS provider if possible).
