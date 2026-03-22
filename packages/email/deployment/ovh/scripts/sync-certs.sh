#!/usr/bin/env bash
set -euo pipefail

TLAO_MAIL_ROOT="${TLAO_MAIL_ROOT:-/opt/tlao-mail}"
ENV_FILE="${TLAO_MAIL_ROOT}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  printf 'Missing %s\n' "${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

CADDY_CERT_ISSUER="${CADDY_CERT_ISSUER:-acme-v02.api.letsencrypt.org-directory}"
CERT_BASE="${TLAO_MAIL_ROOT}/caddy/data/caddy/certificates/${CADDY_CERT_ISSUER}/${MAIL_FQDN}"
CRT_SRC="${CERT_BASE}/${MAIL_FQDN}.crt"
KEY_SRC="${CERT_BASE}/${MAIL_FQDN}.key"
CRT_DST="${TLAO_MAIL_ROOT}/stalwart/certs/mail.pem"
KEY_DST="${TLAO_MAIL_ROOT}/stalwart/certs/mail.key"

[[ -f "${CRT_SRC}" && -f "${KEY_SRC}" ]] || exit 0

changed=0
if ! cmp -s "${CRT_SRC}" "${CRT_DST}" 2>/dev/null; then
  install -m 600 "${CRT_SRC}" "${CRT_DST}"
  changed=1
fi

if ! cmp -s "${KEY_SRC}" "${KEY_DST}" 2>/dev/null; then
  install -m 600 "${KEY_SRC}" "${KEY_DST}"
  changed=1
fi

if [[ "${changed}" -eq 1 ]]; then
  docker compose --env-file "${ENV_FILE}" -f "${TLAO_MAIL_ROOT}/docker-compose.yml" restart stalwart >/dev/null
fi
