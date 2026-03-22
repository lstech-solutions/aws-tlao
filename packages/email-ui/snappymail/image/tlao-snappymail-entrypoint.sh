#!/bin/sh
set -eu

log() {
  printf '[tlao-snappymail] %s\n' "$*"
}

apply_branding_when_ready() {
  config_file='/var/lib/snappymail/_data_/_default_/configs/application.ini'
  admin_password_file='/var/lib/snappymail/_data_/_default_/admin_password.txt'
  attempt=0

  while [ "$attempt" -lt 120 ]; do
    if [ -f "$config_file" ] && [ -f "$admin_password_file" ]; then
      /usr/local/bin/tlao-apply-branding.sh "$config_file"
      return 0
    fi

    attempt=$((attempt + 1))
    sleep 1
  done

  log "Branding skipped because SnappyMail did not finish initializing within 120 seconds."
}

apply_branding_when_ready &
exec /entrypoint.sh "$@"
