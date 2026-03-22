#!/bin/bash
# Stalwart Mail Server — EC2 bootstrap (Amazon Linux 2023)
# Runs once on first boot via EC2 user-data.
set -euo pipefail

REGION="us-east-2"
DOMAIN="xn--tlo-fla.com"          # tláo.com in punycode
MAIL_DOMAIN="mail.${DOMAIN}"
DATA_DIR="/opt/stalwart"
COMPOSE_DIR="/opt/stalwart-compose"
S3_BUCKET="tlao-email-production-emailstoragebucket-sohwhubf"

# ── System setup ─────────────────────────────────────────────────────────────
dnf update -y
dnf install -y docker amazon-cloudwatch-agent awscli

systemctl enable docker
systemctl start docker

# Docker Compose v2
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ── Fetch secrets from SSM ────────────────────────────────────────────────────
ADMIN_PASS=$(aws ssm get-parameter \
  --name "/tlao/email/stalwart-admin-password" \
  --with-decryption \
  --region "$REGION" \
  --query 'Parameter.Value' \
  --output text)

# ── Stalwart data directories ─────────────────────────────────────────────────
mkdir -p "${DATA_DIR}"/{data,logs,certs}
chown -R 1000:1000 "${DATA_DIR}"

# ── Docker Compose file ───────────────────────────────────────────────────────
mkdir -p "$COMPOSE_DIR"
cat > "${COMPOSE_DIR}/docker-compose.yml" <<COMPOSE
version: "3.9"

services:
  stalwart:
    image: stalwartlabs/stalwart:latest
    container_name: stalwart
    restart: unless-stopped
    network_mode: host
    volumes:
      - ${DATA_DIR}/data:/opt/stalwart-mail
      - ${DATA_DIR}/certs:/opt/stalwart-mail/certs
      - ${DATA_DIR}/logs:/opt/stalwart-mail/logs
    environment:
      - STALWART_ADMIN_PASSWORD=${ADMIN_PASS}
    cap_add:
      - NET_BIND_SERVICE
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
COMPOSE

# ── Stalwart config (written after first-run init) ────────────────────────────
# First run: let Stalwart self-initialise, then we patch config
docker compose -f "${COMPOSE_DIR}/docker-compose.yml" up -d

# Wait for Stalwart to initialise its config directory
sleep 15

CONFIG_FILE="${DATA_DIR}/data/etc/config.toml"

# Patch ACME / TLS
cat >> "$CONFIG_FILE" <<TOML

[acme."letsencrypt"]
directory = "https://acme-v02.api.letsencrypt.org/directory"
challenge = "tls-alpn-01"
contact = ["postmaster@${DOMAIN}"]
domains = ["${MAIL_DOMAIN}"]
default = true

[server.tls]
enable = true
implicit = false
timeout = "1m"
certificate = "acme"
sni = []
protocols = ["TLSv1.2", "TLSv1.3"]
ignore-client-order = true

[server.listener."smtp"]
bind = ["0.0.0.0:25"]
protocol = "smtp"

[server.listener."submission"]
bind = ["0.0.0.0:587"]
protocol = "smtp"
tls.implicit = false

[server.listener."submissions"]
bind = ["0.0.0.0:465"]
protocol = "smtp"
tls.implicit = true

[server.listener."imaps"]
bind = ["0.0.0.0:993"]
protocol = "imap"
tls.implicit = true

[server.listener."sieve"]
bind = ["0.0.0.0:4190"]
protocol = "managesieve"

[server.listener."https"]
bind = ["0.0.0.0:443"]
protocol = "http"
tls.implicit = true

[server.listener."http"]
bind = ["0.0.0.0:80"]
protocol = "http"
tls.implicit = false

[storage]
data = "rocksdb"
fts = "rocksdb"
blob = "s3"
lookup = "rocksdb"

[store."s3"]
type = "s3"
bucket = "${S3_BUCKET}"
region = "${REGION}"
prefix = "stalwart/"

[session.ehlo]
reject-non-fqdn = false

[auth.dkim]
sign = ["rsa"]
TOML

# Restart to apply config
docker compose -f "${COMPOSE_DIR}/docker-compose.yml" restart

# ── CloudWatch agent ──────────────────────────────────────────────────────────
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<CW
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "${DATA_DIR}/logs/*.log",
            "log_group_name": "/tlao/email/stalwart",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "TLAO/Email",
    "metrics_collected": {
      "mem": { "measurement": ["mem_used_percent"] },
      "disk": { "measurement": ["disk_used_percent"], "resources": ["/"] }
    }
  }
}
CW
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

echo "Stalwart bootstrap complete"
