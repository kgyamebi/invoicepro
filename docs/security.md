# Security

- Passwords hashed with bcrypt (12 rounds)
- Opaque session tokens stored as SHA-256 hashes
- RBAC on invoice, customer, payment, report and billing actions
- Tenant checks on every document, customer and product
- Share tokens are 48 hex characters, hashed, expiring and revocable
- Webhook signatures verified; events processed once
- Rate limits on auth
- Security headers in middleware
- No raw stack traces in API responses
- Customer document contents are not sent to AI unless the user triggers an AI feature
