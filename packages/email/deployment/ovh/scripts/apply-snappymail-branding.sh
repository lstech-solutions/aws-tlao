#!/usr/bin/env bash
set -euo pipefail

requested_root="${TLAO_MAIL_ROOT:-}"
TLAO_MAIL_ROOT="${requested_root:-/opt/tlao-mail}"
ENV_FILE="${TLAO_MAIL_ROOT}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  printf 'Missing %s\n' "${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

TLAO_MAIL_ROOT="${requested_root:-${TLAO_MAIL_ROOT:-/opt/tlao-mail}}"

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${TLAO_MAIL_ROOT}/docker-compose.yml" "$@"
}

printf 'Rebuilding TLÁO-branded SnappyMail image\n'
compose build snappymail

printf 'Restarting SnappyMail with TLÁO branding\n'
compose up -d snappymail
