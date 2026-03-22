# @tlao/email-ui

`@tlao/email-ui` owns the TLÁO mail user interface surface.

Today that means a production-friendly fallback around [SnappyMail](https://snappymail.eu/) so the OVH mail substrate can expose webmail immediately. Later, this package is the right place to grow a custom TLÁO webmail and workflow UI without changing the underlying Stalwart mail substrate.

## Current Role

- Provide a fallback webmail UI while the custom TLÁO mail UI is built.
- Keep webmail deployment assets and multi-domain conventions out of the AWS-only infra package.
- Normalize mailbox provisioning around email-based logins so generic IMAP webmail clients work cleanly across multiple hosted domains.
- Own the branded SnappyMail overlay so TLÁO can ship a consistent fallback webmail experience without hand-editing the VPS.

## Multi-Domain Strategy

- Run a single shared SnappyMail runtime alongside Stalwart on the OVH VPS.
- Serve webmail from dedicated hostnames such as `webmail.xn--tlo-fla.com`.
- Generate one SnappyMail domain config per hosted mail domain.
- Keep IMAP/SMTP pointed at the shared Stalwart host, currently `mail.xn--tlo-fla.com`.
- Use full email addresses as the default Stalwart principal name for newly provisioned mailboxes. That is the cleanest cross-domain login contract for SnappyMail and for a future custom UI.

The current bootstrapped mailboxes on the live server predate this policy, so some of them still use legacy principal names such as `admin` or `cig-admin`. Those accounts remain valid, but future TLÁO-managed mailboxes should use the email address as the login identifier.

## Package Contents

- [`scripts/render-snappymail.mjs`](./scripts/render-snappymail.mjs): generates SnappyMail domain JSON files from environment variables.
- [`snappymail/domain-template.json`](./snappymail/domain-template.json): upstream-aligned template shape for generated domain configs.
- [`snappymail/image`](./snappymail/image): TLÁO-branded wrapper image context built on top of upstream SnappyMail.
- OVH deployment integration lives in [`packages/email/deployment/ovh`](../email/deployment/ovh/README.md), where the compose stack, Caddy config, and host bootstrap scripts consume this package's conventions.

## Local Rendering

Generate domain configs locally:

```bash
SNAPPYMAIL_ALLOWED_DOMAINS=xn--tlo-fla.com,cig.technology \
SNAPPYMAIL_IMAP_HOST=mail.xn--tlo-fla.com \
SNAPPYMAIL_IMAP_PORT=993 \
SNAPPYMAIL_IMAP_SECURITY=ssl \
SNAPPYMAIL_SMTP_HOST=mail.xn--tlo-fla.com \
SNAPPYMAIL_SMTP_PORT=587 \
SNAPPYMAIL_SMTP_SECURITY=starttls \
SNAPPYMAIL_LOGIN_MODE=email \
pnpm --filter @tlao/email-ui run render:snappymail -- --output /tmp/tlao-snappymail
```

That produces SnappyMail domain configs under `/tmp/tlao-snappymail/_data_/_default_/domains`.

## Branding Overlay

The branded fallback webmail now lives in [`snappymail/image`](./snappymail/image).

- The Dockerfile wraps the upstream `djmaze/snappymail` image instead of patching the live VPS by hand.
- The TLÁO source theme is kept under `themes/TlaoMail`, then copied over the pinned upstream `Default` theme path at image-build time so SnappyMail actually serves it.
- The wrapper entrypoint reapplies TLÁO branding to `application.ini` on each container start so restarts and rebuilds do not drift back to stock SnappyMail visuals.
- Brand defaults come from environment variables such as `SNAPPYMAIL_BRAND_TITLE`, `SNAPPYMAIL_BRAND_THEME`, and `SNAPPYMAIL_BRAND_ALLOW_THEME_SWITCH`.

This keeps SnappyMail upgradeable while still giving TLÁO a distinct webmail identity until the custom UI fully replaces it.

## Runtime Notes

- SnappyMail admin is exposed at `https://<webmail-host>/?admin`.
- On first boot, SnappyMail writes the bootstrap admin password to `.../admin_password.txt` inside its writable data directory.
- Domain configs live under `.../_data_/_default_/domains/*.json`.
- The OVH bundle keeps SnappyMail behind Caddy and on the same Docker network as Stalwart so it can act as a fallback UI without becoming a second mail engine.
- The OVH bundle copies this package's SnappyMail image context into `/opt/tlao-mail/email-ui/snappymail-image` and builds it there during `docker compose up`.
