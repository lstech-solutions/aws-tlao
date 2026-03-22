#!/bin/bash
# Adds DKIM signing config to Stalwart
set -euo pipefail

CONFIG=/opt/stalwart/mail/etc/config.toml

cat >> "$CONFIG" << 'TOML'

[signature."mail"]
private-key = "/opt/stalwart/etc/dkim/xn--tlo-fla.com.key"
domain = "xn--tlo-fla.com"
selector = "mail"
headers.sign = ["From", "To", "Date", "Subject", "Message-ID"]
algorithm = "rsa-sha256"
canonicalization = "relaxed/relaxed"
set-body-length = false
report = false

[auth.dkim]
verify = "relaxed"
sign = ["mail"]
TOML

docker compose -f /opt/stalwart-compose/docker-compose.yml restart
sleep 5
docker ps --format "table {{.Names}}\t{{.Status}}"
echo "DKIM configured."
