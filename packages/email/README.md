# @tlao/email

TLÁO Email System - Standalone email package with Stalwart integration.

## Overview

Enterprise-grade email hosting with automated operational intelligence extraction. Integrates Stalwart mail server with TLÁO's execution engine.

## Features

- Stalwart mail server integration (IMAP, JMAP, SMTP, CalDAV, CardDAV)
- JMAP-first email ingestion
- Bedrock-powered email classification
- Automated agent execution (Plan/Grant)
- Standard email client support (Thunderbird, Outlook, Gmail, Apple Mail)
- Autodiscover/autoconfig for easy client setup

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev      # Watch mode
pnpm build    # Build package
pnpm test     # Run tests
pnpm lint     # Lint code
```

## Deployment

- AWS-specific infrastructure remains under [`infrastructure/`](./infrastructure).
- The standalone OVH/VPS mail substrate bundle lives in [`deployment/ovh`](./deployment/ovh/README.md).
- Use the OVH bundle when you need Stalwart + Caddy on a single Ubuntu 24.04 node while keeping TLÁO ingestion and provisioning logic in this package.

## Stalwart Management Auth

- Mailbox provisioning should use Stalwart management credentials, not mailbox IMAP credentials.
- For the OVH deployment, prefer `STALWART_API_USERNAME` plus `STALWART_API_SECRET`.
- `STALWART_API_KEY` remains as a backward-compatible single-string auth field and can contain `username:secret` for Basic auth.
- Stalwart API key principals are for the management REST API only. They cannot be used for JMAP, IMAP, or POP3 mailbox access.
- New TLÁO-managed mailbox principals should use the full email address as the login identifier. That keeps multi-domain client setup and SnappyMail-compatible webmail straightforward.
- The current hosted mailboxes on the OVH host have been migrated to email-based principal names so SnappyMail and other generic clients can use one login convention across domains.

## Architecture

Stalwart → JMAP Ingestion → Email Parser → Classification → Backend API → Artifacts
