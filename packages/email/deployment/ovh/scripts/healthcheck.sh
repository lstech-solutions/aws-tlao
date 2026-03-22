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

printf '== Compose services ==\n'
compose ps

printf '\n== Open ports ==\n'
ss -tulpn | egrep ':22|:25|:80|:443|:465|:587|:993|:8080' || true

printf '\n== Local HTTP/JMAP ==\n'
curl -fsSI http://127.0.0.1:8080/ >/dev/null && echo '127.0.0.1:8080 reachable'
curl -fsS http://127.0.0.1:8080/.well-known/jmap -o /dev/null && echo 'Local JMAP discovery reachable'

printf '\n== DKIM ==\n'
if [[ -f "${TLAO_MAIL_ROOT}/stalwart/dkim/primary.ed25519.key" ]]; then
  echo "DKIM private key present for selector ${DKIM_SELECTOR:-mail}"
else
  echo 'DKIM private key missing'
  exit 1
fi

if [[ -n "${MAIL_ALT_DOMAIN:-}" ]]; then
  if [[ -f "${TLAO_MAIL_ROOT}/stalwart/dkim/secondary.ed25519.key" ]]; then
    echo "Secondary DKIM private key present for ${MAIL_ALT_DOMAIN}"
  else
    echo "Secondary DKIM private key missing for ${MAIL_ALT_DOMAIN}"
    exit 1
  fi
fi

printf '\n== SnappyMail ==\n'
if compose ps snappymail 2>/dev/null | grep -q 'Up'; then
  echo 'SnappyMail container is running'
  if [[ -n "${SNAPPYMAIL_HOSTS:-}" ]] && compose ps caddy 2>/dev/null | grep -q 'Up'; then
    snappymail_host="${SNAPPYMAIL_HOSTS%%,*}"
    snappymail_host="${snappymail_host// /}"
    curl -fsSI "https://${snappymail_host}" >/dev/null && echo "https://${snappymail_host} reachable"
    branding_check_file="$(mktemp)"
    curl -fsS "https://${snappymail_host}" -o "${branding_check_file}"
    grep -Fq "${SNAPPYMAIL_BRAND_TITLE:-TLÁO Mail}" "${branding_check_file}" && echo 'TLÁO branding visible on webmail'
    rm -f "${branding_check_file}"
  fi
else
  echo 'SnappyMail container is not running'
fi

if compose ps caddy 2>/dev/null | grep -q 'Up'; then
  printf '\n== Public HTTPS/JMAP ==\n'
  curl -fsSI "https://${MAIL_FQDN}" >/dev/null && echo "https://${MAIL_FQDN} reachable"
  curl -fsS "https://${MAIL_FQDN}/.well-known/jmap" -o /dev/null && echo 'Public JMAP discovery reachable'
fi
