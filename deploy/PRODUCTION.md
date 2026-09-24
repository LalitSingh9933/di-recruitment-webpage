# Production handover

These are deployment templates, not evidence of a live or audited production release.
Use a staging server first. Hosting, domain, official social URLs and secrets are
still supplied by the owner. The existing PDF predates this hardening/Tailwind pass.

## Release checklist

1. Back up MySQL and all three upload directories; restore-test the backup.
2. Create an unprivileged `diapp` Linux account and install a supported Node runtime,
   MySQL and Nginx. Verify `/usr/bin/node` in the service matches its installed path.
3. Place source in `/srv/di-recruitment`, run `npm ci`, and do not copy Windows
   `node_modules` or `.next`. Keep the app itself out of the web server's document root.
4. Set secrets in `/etc/di-recruitment.env`, readable only by root and the app group.
   Configure `DATABASE_URL`, a random `AUTH_SECRET` (at least 32 characters),
   `APP_URL=https://your-domain`, `FACEBOOK_PAGE_URL`, `LINKEDIN_URL`, `YOUTUBE_URL`
   and `TIKTOK_URL`. Never use the example secret or a root database account.
5. Create persistent writable folders under `/var/lib/di-recruitment` and configure
   `GALLERY_STORAGE_DIR`, `TEAM_STORAGE_DIR`, `CONTENT_IMAGE_STORAGE_DIR` to them.
   Transfer existing files with their original filenames. Keep these outside releases.
6. Apply reviewed schema migrations as described below. Do not seed an imported DB.
7. With the environment loaded, run `npm run lint`, `npm run format:check`,
   `npm run build` and the staging integration checks. Some existing test scripts
   need the configured admin credentials and create/remove test records.
8. Install the systemd service, set ownership and ensure `.next` is writable by
   `diapp`. Install TLS certificates before enabling the HTTPS Nginx example.
   Replace domains, check `nginx -t`, then reload Nginx and enable the app service.
9. Allow public HTTPS/HTTP and restricted SSH only. Keep 3001/3306 private. Configure
   backup and external uptime alerts for `/api/health`; it reports DB availability,
   not complete filesystem or feature health. Never expose `.env`, backups or uploads
   directly through Nginx aliases.
10. Smoke-test login/logout/password change, published/draft visibility, all CRUD,
    forms, uploads, video seeking, responsive footer and carousel controls over HTTPS.

## Migration discipline

Local development previously used `db push`. The initial migration generated in
`prisma/migrations/0_initial` includes the full schema, including the new RateLimit
table. On a NEW EMPTY database, use `npx prisma migrate deploy` then generate/build.

For an EXISTING database, do not deploy the initial migration over its tables.
Back up, compare its schema against `schema.prisma`, and bring it to the same state
using reviewed additive SQL (including RateLimit). Only when they match, mark the
baseline applied with `npx prisma migrate resolve --applied 0_initial`.
Never use migrate reset or accept a data-loss prompt. Subsequent migrations are
created/reviewed in development and deployed with Prisma 6 `migrate deploy`.

## Abuse controls and limits

Login allows 10 attempts per normalized email per fixed 15-minute window; password
changes allow 5 per admin; contacts allow 3 per email; applications allow 5 per email.
Counters are atomic and shared in MySQL. They fail closed when the DB is unavailable.
Email-only limits do not stop distributed abuse using different addresses. Nginx
adds per-client-IP request limiting; tune it in staging to avoid false positives.
Behind another proxy/CDN, configure trusted real-IP handling rather than blindly
trusting arbitrary forwarded headers. Consider CAPTCHA/MFA for higher-risk launches.

Run this maintenance query daily using a restricted scheduled maintenance job:

```sql
DELETE FROM RateLimit WHERE expiresAt < UTC_TIMESTAMP() - INTERVAL 1 DAY;
```

The CSP restricts framing, plugins, base URLs and form destinations; it is not a
strict nonce-based script CSP. Review privacy/consent requirements for Facebook.
Login throttling does not constitute an independent penetration test.

## Backup, restore and updates

Back up the database and `/var/lib/di-recruitment` together, with writes paused for
a consistent recovery point. Encrypt off-server copies, restrict access, define a
retention period, and restore-test them. A database-only backup loses media.
Do not include passwords on command lines. Monitor disk capacity and backup failures.

Keep the prior app release and matching schema backup. Apply additive migrations
before switching traffic, health-check the new process, and only then reopen writes.
If rollback follows new submissions, reconcile those writes before restoring old data.

## Launch gates still requiring an operator

- Official social profile URLs (unconfigured labels are deliberately disabled).
- Production hosting, domain/TLS, secrets, persistent disk and backup restore test.
- Review any remaining `npm audit` findings; do not blindly run `audit fix --force`.
- Staging browser/accessibility testing and real load/abuse testing.
- Verify business statistics, license claims and consent to published content.
- Confirm privacy policy, personal-data retention and account recovery procedure.

Tailwind utilities use the `tw:` prefix and omit Preflight to preserve existing CSS.
The new footer is styled with Tailwind; the app has not been completely rewritten.
