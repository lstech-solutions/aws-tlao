#!/bin/bash
# Patches Stalwart config for production: S3 blob storage + ACME TLS
set -euo pipefail

CONFIG=/opt/stalwart/mail/etc/config.toml

cp "$CONFIG" "${CONFIG}.bak"

# Switch blob storage from rocksdb to S3
sed -i 's/^blob = "rocksdb"/blob = "s3"/' "$CONFIG"

# Append S3 store, ACME, and TLS config
cat >> "$CONFIG" << 'TOML'

[store."s3"]
type = "s3"
bucket = "tlao-email-production-emailstoragebucket-sohwhubf"
region = "us-east-2"
prefix = "stalwart/"

[acme."letsencrypt"]
directory = "https://acme-v02.api.letsencrypt.org/directory"
challenge = "tls-alpn-01"
contact = ["postmaster@xn--tlo-fla.com"]
domains = ["mail.xn--tlo-fla.com"]
default = true

[server.tls]
enable = true
certificate = "acme"
TOML

echo "Config patched. Restarting Stalwart..."
docker compose -f /opt/stalwart-compose/docker-compose.yml restart
sleep 8
docker ps --format "table {{.Names}}\t{{.Status}}"
docker logs stalwart 2>&1 | tail -15
echo "Done."
