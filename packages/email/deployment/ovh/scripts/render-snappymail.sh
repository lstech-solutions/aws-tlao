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

security_type() {
  case "${1,,}" in
    none)
      echo 0
      ;;
    ssl|tls)
      echo 1
      ;;
    starttls)
      echo 2
      ;;
    auto|autodetect|auto_detect)
      echo 9
      ;;
    *)
      printf 'Unsupported security mode: %s\n' "$1" >&2
      exit 1
      ;;
  esac
}

SNAPPYMAIL_ALLOWED_DOMAINS="${SNAPPYMAIL_ALLOWED_DOMAINS:-${MAIL_PRIMARY_DOMAIN:-}}"
SNAPPYMAIL_IMAP_HOST="${SNAPPYMAIL_IMAP_HOST:-${MAIL_FQDN:-}}"
SNAPPYMAIL_IMAP_PORT="${SNAPPYMAIL_IMAP_PORT:-993}"
SNAPPYMAIL_IMAP_SECURITY="${SNAPPYMAIL_IMAP_SECURITY:-ssl}"
SNAPPYMAIL_SMTP_HOST="${SNAPPYMAIL_SMTP_HOST:-${MAIL_FQDN:-}}"
SNAPPYMAIL_SMTP_PORT="${SNAPPYMAIL_SMTP_PORT:-587}"
SNAPPYMAIL_SMTP_SECURITY="${SNAPPYMAIL_SMTP_SECURITY:-starttls}"
SNAPPYMAIL_LOGIN_MODE="${SNAPPYMAIL_LOGIN_MODE:-email}"

if [[ -z "${SNAPPYMAIL_ALLOWED_DOMAINS}" ]]; then
  printf 'SNAPPYMAIL_ALLOWED_DOMAINS is required\n' >&2
  exit 1
fi

if [[ "${SNAPPYMAIL_LOGIN_MODE}" == "email" ]]; then
  short_login=false
elif [[ "${SNAPPYMAIL_LOGIN_MODE}" == "localpart" ]]; then
  short_login=true
else
  printf 'SNAPPYMAIL_LOGIN_MODE must be "email" or "localpart"\n' >&2
  exit 1
fi

imap_type="$(security_type "${SNAPPYMAIL_IMAP_SECURITY}")"
smtp_type="$(security_type "${SNAPPYMAIL_SMTP_SECURITY}")"

base_dir="${TLAO_MAIL_ROOT}/snappymail/_data_/_default_"
domains_dir="${base_dir}/domains"
install -d -m 0755 "${domains_dir}"

IFS=',' read -r -a domains <<<"${SNAPPYMAIL_ALLOWED_DOMAINS}"

for raw_domain in "${domains[@]}"; do
  domain="${raw_domain// /}"
  if [[ -z "${domain}" ]]; then
    continue
  fi

  jq -n \
    --arg domain "${domain}" \
    --arg imap_host "${SNAPPYMAIL_IMAP_HOST}" \
    --argjson imap_port "${SNAPPYMAIL_IMAP_PORT}" \
    --argjson imap_type "${imap_type}" \
    --arg smtp_host "${SNAPPYMAIL_SMTP_HOST}" \
    --argjson smtp_port "${SNAPPYMAIL_SMTP_PORT}" \
    --argjson smtp_type "${smtp_type}" \
    --argjson short_login "${short_login}" \
    --arg login_mode "${SNAPPYMAIL_LOGIN_MODE}" \
    '{
      IMAP: {
        host: $imap_host,
        port: $imap_port,
        type: $imap_type,
        timeout: 300,
        shortLogin: $short_login,
        lowerLogin: true,
        sasl: ["SCRAM-SHA3-512", "SCRAM-SHA-512", "SCRAM-SHA-256", "SCRAM-SHA-1", "PLAIN", "LOGIN"],
        ssl: {
          verify_peer: false,
          verify_peer_name: false,
          allow_self_signed: false,
          SNI_enabled: true,
          disable_compression: true,
          security_level: 1
        },
        disabled_capabilities: ["METADATA", "OBJECTID", "PREVIEW", "STATUS=SIZE"],
        use_expunge_all_on_delete: false,
        fast_simple_search: true,
        force_select: false,
        message_all_headers: false,
        message_list_limit: 10000,
        search_filter: ""
      },
      SMTP: {
        host: $smtp_host,
        port: $smtp_port,
        type: $smtp_type,
        timeout: 60,
        shortLogin: $short_login,
        lowerLogin: true,
        sasl: ["SCRAM-SHA3-512", "SCRAM-SHA-512", "SCRAM-SHA-256", "SCRAM-SHA-1", "PLAIN", "LOGIN"],
        ssl: {
          verify_peer: false,
          verify_peer_name: false,
          allow_self_signed: false,
          SNI_enabled: true,
          disable_compression: true,
          security_level: 1
        },
        useAuth: true,
        setSender: false,
        usePhpMail: false
      },
      Sieve: {
        host: "localhost",
        port: 4190,
        type: 0,
        timeout: 10,
        shortLogin: $short_login,
        lowerLogin: true,
        sasl: ["SCRAM-SHA3-512", "SCRAM-SHA-512", "SCRAM-SHA-256", "SCRAM-SHA-1", "PLAIN", "LOGIN"],
        ssl: {
          verify_peer: false,
          verify_peer_name: false,
          allow_self_signed: false,
          SNI_enabled: true,
          disable_compression: true,
          security_level: 1
        },
        enabled: false
      },
      whiteList: "",
      tlaoMetadata: {
        domain: $domain,
        generatedBy: "@tlao/email-ui",
        loginMode: $login_mode
      }
    }' >"${domains_dir}/${domain}.json"

  chmod 0644 "${domains_dir}/${domain}.json"
  printf 'Rendered SnappyMail domain config: %s\n' "${domains_dir}/${domain}.json"
done
