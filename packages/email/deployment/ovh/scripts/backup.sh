#!/usr/bin/env bash
set -euo pipefail

TLAO_MAIL_ROOT="${TLAO_MAIL_ROOT:-/opt/tlao-mail}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${TLAO_MAIL_ROOT}/backups/tlao-mail-${STAMP}.tar.zst"

install -d -m 0755 "${TLAO_MAIL_ROOT}/backups"

tar --use-compress-program="zstd -T0 -19" \
  -cpf "${OUT}" \
  "${TLAO_MAIL_ROOT}/stalwart" \
  "${TLAO_MAIL_ROOT}/.env" \
  "${TLAO_MAIL_ROOT}/docker-compose.yml" \
  "${TLAO_MAIL_ROOT}/caddy/Caddyfile"

find "${TLAO_MAIL_ROOT}/backups" -type f -name 'tlao-mail-*.tar.zst' -mtime "+${BACKUP_RETENTION_DAYS}" -delete
