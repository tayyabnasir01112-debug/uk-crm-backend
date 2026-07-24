# Security Policy

## Reporting a Security Issue

Do not open a public issue containing credentials, tokens, private customer data, database details, or exploit details. Contact the repository owner through the public GitHub profile and share sensitive details only after a private channel is established.

## Secret Handling

- Keep secrets in local `.env` files, hosting-provider environment variables, or a dedicated secret manager.
- Never commit real `DATABASE_URL`, `SESSION_SECRET`, SMTP credentials, API keys, OAuth secrets, service tokens, cookies, or private keys.
- Treat database connection strings as credentials because they often contain usernames, passwords, hostnames, and database names.
- Treat webhook URLs and session secrets as credentials.
- Use `.env.example` only for placeholders.

## If a Credential Is Exposed

If a real credential appears in a commit, log, issue, screenshot, or deployment document:

1. Rotate or revoke the credential in the provider dashboard immediately.
2. Replace the public value with a placeholder in the repository.
3. Review application logs and provider audit logs for unexpected access.
4. Consider Git history cleanup if the exposed value must be removed from old commits.

Editing a later commit does not make the original credential safe. Rotation is still required.

## Public Repository Boundaries

Do not commit client data, private deployment URLs, internal setup notes, generated databases, local logs, proprietary selectors, or screenshots that expose account names or customer records.
