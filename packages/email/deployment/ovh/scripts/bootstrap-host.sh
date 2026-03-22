#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Prepare an Ubuntu 24.04 OVH VPS for the TLÁO Mail Core substrate.

Usage:
  sudo ./packages/email/deployment/ovh/scripts/bootstrap-host.sh

Optional environment variables:
  TLAO_MAIL_ROOT=/opt/tlao-mail
EOF
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  exec sudo -E bash "$0" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EMAIL_UI_ROOT="$(cd "${BUNDLE_ROOT}/../../../email-ui" && pwd)"
TLAO_MAIL_ROOT="${TLAO_MAIL_ROOT:-/opt/tlao-mail}"
TARGET_ENV="${TLAO_MAIL_ROOT}/.env"

log() {
  printf '[tlao-mail-bootstrap] %s\n' "$*"
}

install_file() {
  local source_path="$1"
  local target_path="$2"
  local mode="$3"

  install -d -m 0755 "$(dirname "${target_path}")"
  install -m "${mode}" "${source_path}" "${target_path}"
}

install_tree() {
  local source_dir="$1"
  local target_dir="$2"
  local file_mode="$3"

  install -d -m 0755 "${target_dir}"
  cp -R "${source_dir}/." "${target_dir}/"
  find "${target_dir}" -type d -exec chmod 0755 {} +
  find "${target_dir}" -type f -exec chmod "${file_mode}" {} +
}

set_sshd_option() {
  local key="$1"
  local value="$2"

  if grep -qiE "^[#[:space:]]*${key}[[:space:]]+" /etc/ssh/sshd_config; then
    sed -ri "s|^[#[:space:]]*${key}[[:space:]]+.*$|${key} ${value}|I" /etc/ssh/sshd_config
  else
    printf '%s %s\n' "${key}" "${value}" >>/etc/ssh/sshd_config
  fi
}

ensure_env_secret() {
  if grep -q '^STALWART_ADMIN_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET$' "${TARGET_ENV}"; then
    local generated_secret
    generated_secret="$(openssl rand -base64 48 | tr -d '\n' | tr '+/' '-_')"
    sed -i "s|^STALWART_ADMIN_SECRET=.*$|STALWART_ADMIN_SECRET=${generated_secret}|" "${TARGET_ENV}"
  fi
}

ensure_root_cron_line() {
  local line="$1"
  local tmpfile
  tmpfile="$(mktemp)"
  crontab -l 2>/dev/null >"${tmpfile}" || true

  if ! grep -Fxq "${line}" "${tmpfile}"; then
    printf '%s\n' "${line}" >>"${tmpfile}"
    crontab "${tmpfile}"
  fi

  rm -f "${tmpfile}"
}

if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID:-}" != "ubuntu" ]]; then
    log "This script expects Ubuntu. Found ${ID:-unknown}."
    exit 1
  fi
  if [[ "${VERSION_ID:-}" != "24.04" ]]; then
    log "Warning: expected Ubuntu 24.04 LTS, found ${VERSION_ID:-unknown}."
  fi
fi

export DEBIAN_FRONTEND=noninteractive

log "Updating system packages and installing base dependencies."
apt-get update
apt-get full-upgrade -y
apt-get install -y \
  ca-certificates \
  cron \
  curl \
  dnsutils \
  fail2ban \
  gnupg \
  jq \
  lsb-release \
  openssl \
  swaks \
  ufw \
  unattended-upgrades \
  zstd \
  apache2-utils
systemctl enable --now cron unattended-upgrades

log "Stopping common mail and web services if present."
systemctl disable --now apache2 nginx postfix exim4 dovecot 2>/dev/null || true

log "Applying SSH hardening drop-in."
SSH_ADMIN_USER="${SSH_ADMIN_USER:-${SUDO_USER:-ubuntu}}"
SSH_PASSWORD_AUTH="${SSH_PASSWORD_AUTH:-auto}"

if [[ "${SSH_PASSWORD_AUTH}" == "auto" ]]; then
  if [[ -s "/home/${SSH_ADMIN_USER}/.ssh/authorized_keys" ]]; then
    SSH_PASSWORD_AUTH="no"
  else
    SSH_PASSWORD_AUTH="yes"
    log "No authorized_keys found for ${SSH_ADMIN_USER}; keeping SSH password authentication enabled to avoid lockout."
  fi
fi

set_sshd_option PermitRootLogin no
set_sshd_option PasswordAuthentication "${SSH_PASSWORD_AUTH}"
set_sshd_option KbdInteractiveAuthentication no
set_sshd_option ChallengeResponseAuthentication no
set_sshd_option PubkeyAuthentication yes
set_sshd_option X11Forwarding no
set_sshd_option AllowUsers "${SSH_ADMIN_USER}"
set_sshd_option MaxAuthTries 3
set_sshd_option ClientAliveInterval 300
set_sshd_option ClientAliveCountMax 2
sshd -t
systemctl reload ssh

log "Configuring fail2ban for SSH."
install -d -m 0755 /etc/fail2ban/jail.d
cat >/etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
port = ssh
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban

log "Installing Docker Engine and Compose plugin."
install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
fi
chmod a+r /etc/apt/keyrings/docker.gpg
cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  usermod -aG docker "${SUDO_USER}" || true
fi

log "Configuring UFW."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH || true
ufw allow 25/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 465/tcp || true
ufw allow 587/tcp || true
ufw allow 993/tcp || true
ufw --force enable

log "Creating target directories under ${TLAO_MAIL_ROOT}."
install -d -m 0755 "${TLAO_MAIL_ROOT}"
install -d -m 0755 "${TLAO_MAIL_ROOT}/stalwart/etc" "${TLAO_MAIL_ROOT}/stalwart/data" "${TLAO_MAIL_ROOT}/stalwart/logs" "${TLAO_MAIL_ROOT}/stalwart/certs" "${TLAO_MAIL_ROOT}/stalwart/dkim"
install -d -m 0755 "${TLAO_MAIL_ROOT}/caddy/data" "${TLAO_MAIL_ROOT}/caddy/config" "${TLAO_MAIL_ROOT}/caddy/logs"
install -d -m 0755 "${TLAO_MAIL_ROOT}/snappymail"
install -d -m 0755 "${TLAO_MAIL_ROOT}/email-ui"
install -d -m 0755 "${TLAO_MAIL_ROOT}/backups" "${TLAO_MAIL_ROOT}/scripts"

log "Installing deployment bundle files."
install_file "${BUNDLE_ROOT}/docker-compose.yml" "${TLAO_MAIL_ROOT}/docker-compose.yml" 0644
install_file "${BUNDLE_ROOT}/stalwart/config.toml" "${TLAO_MAIL_ROOT}/stalwart/etc/config.toml" 0644
install_file "${BUNDLE_ROOT}/caddy/Caddyfile" "${TLAO_MAIL_ROOT}/caddy/Caddyfile" 0644
install_file "${BUNDLE_ROOT}/scripts/backup.sh" "${TLAO_MAIL_ROOT}/scripts/backup.sh" 0750
install_file "${BUNDLE_ROOT}/scripts/apply-snappymail-branding.sh" "${TLAO_MAIL_ROOT}/scripts/apply-snappymail-branding.sh" 0750
install_file "${BUNDLE_ROOT}/scripts/generate-dkim.sh" "${TLAO_MAIL_ROOT}/scripts/generate-dkim.sh" 0750
install_file "${BUNDLE_ROOT}/scripts/render-snappymail.sh" "${TLAO_MAIL_ROOT}/scripts/render-snappymail.sh" 0750
install_file "${BUNDLE_ROOT}/scripts/sync-certs.sh" "${TLAO_MAIL_ROOT}/scripts/sync-certs.sh" 0750
install_file "${BUNDLE_ROOT}/scripts/healthcheck.sh" "${TLAO_MAIL_ROOT}/scripts/healthcheck.sh" 0750
install_tree "${EMAIL_UI_ROOT}/snappymail/image" "${TLAO_MAIL_ROOT}/email-ui/snappymail-image" 0644
find "${TLAO_MAIL_ROOT}/email-ui/snappymail-image" -type f -name '*.sh' -exec chmod 0755 {} +

if [[ ! -f "${TARGET_ENV}" ]]; then
  log "Installing initial environment file."
  install -m 0600 "${BUNDLE_ROOT}/.env.example" "${TARGET_ENV}"
fi
ensure_env_secret

set -a
# shellcheck disable=SC1090
source "${TARGET_ENV}"
set +a

log "Setting hostname to ${MAIL_FQDN}."
hostnamectl set-hostname "${MAIL_FQDN}"

if [[ ! -f "${TLAO_MAIL_ROOT}/stalwart/certs/mail.pem" || ! -f "${TLAO_MAIL_ROOT}/stalwart/certs/mail.key" ]]; then
  log "Generating short-lived bootstrap certificate for ${MAIL_FQDN}."
  openssl req -x509 -newkey rsa:4096 -sha256 -days 7 -nodes \
    -keyout "${TLAO_MAIL_ROOT}/stalwart/certs/mail.key" \
    -out "${TLAO_MAIL_ROOT}/stalwart/certs/mail.pem" \
    -subj "/CN=${MAIL_FQDN}" \
    -addext "subjectAltName=DNS:${MAIL_FQDN}"
  chmod 600 "${TLAO_MAIL_ROOT}/stalwart/certs/mail.key" "${TLAO_MAIL_ROOT}/stalwart/certs/mail.pem"
fi

log "Ensuring the primary DKIM key exists."
"${TLAO_MAIL_ROOT}/scripts/generate-dkim.sh"

log "Rendering SnappyMail domain configuration."
"${TLAO_MAIL_ROOT}/scripts/render-snappymail.sh"

ensure_root_cron_line "17 3 * * * ${TLAO_MAIL_ROOT}/scripts/sync-certs.sh"
ensure_root_cron_line "42 3 * * * ${TLAO_MAIL_ROOT}/scripts/backup.sh"

log "Bootstrap complete."
log "Review ${TARGET_ENV}, then start Stalwart and SnappyMail:"
log "  docker compose --env-file ${TARGET_ENV} -f ${TLAO_MAIL_ROOT}/docker-compose.yml up -d stalwart snappymail"
log "Rebuild the TLÁO-branded SnappyMail wrapper when branding assets change:"
log "  ${TLAO_MAIL_ROOT}/scripts/apply-snappymail-branding.sh"
log "After DNS and OVH PTR are ready, start Caddy:"
log "  docker compose --env-file ${TARGET_ENV} -f ${TLAO_MAIL_ROOT}/docker-compose.yml up -d caddy"
