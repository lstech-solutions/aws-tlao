#!/bin/sh
set -eu

config_file="${1:-/var/lib/snappymail/_data_/_default_/configs/application.ini}"

if [ ! -f "$config_file" ]; then
  printf '[tlao-snappymail] Missing config file: %s\n' "$config_file" >&2
  exit 0
fi

brand_theme="${SNAPPYMAIL_BRAND_THEME:-Default}"
brand_title="${SNAPPYMAIL_BRAND_TITLE:-TLÁO Mail}"
brand_loading="${SNAPPYMAIL_BRAND_LOADING_DESCRIPTION:-$brand_title}"
brand_favicon="${SNAPPYMAIL_BRAND_FAVICON_URL:-/snappymail/v/2.38.2/themes/Default/images/tlao-mark.svg}"
brand_signature="${SNAPPYMAIL_BRAND_SERVER_SIGNATURE:-$brand_title}"
brand_theme_switch="${SNAPPYMAIL_BRAND_ALLOW_THEME_SWITCH:-false}"

to_snappymail_switch() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on)
      printf 'On'
      ;;
    *)
      printf 'Off'
      ;;
  esac
}

escape_sed_replacement() {
  printf '%s' "$1" | sed 's/[\/&]/\\&/g'
}

replace_in_section() {
  file_path="$1"
  section_name="$2"
  key_name="$3"
  value="$4"
  escaped_value="$(escape_sed_replacement "$value")"
  sed -i "/^\\[$section_name\\]/,/^\\[/ s|^$key_name = .*|$key_name = $escaped_value|" "$file_path"
}

replace_in_section "$config_file" webmail title "\"${brand_title}\""
replace_in_section "$config_file" webmail loading_description "\"${brand_loading}\""
replace_in_section "$config_file" webmail favicon_url "\"${brand_favicon}\""
replace_in_section "$config_file" webmail theme "\"${brand_theme}\""
replace_in_section "$config_file" webmail allow_themes "$(to_snappymail_switch "$brand_theme_switch")"
replace_in_section "$config_file" webmail allow_user_background Off
replace_in_section "$config_file" security custom_server_signature "\"${brand_signature}\""

cache_dir='/var/lib/snappymail/_data_/_default_/cache'
if [ -d "$cache_dir" ]; then
  find "$cache_dir" -mindepth 1 ! -name 'CACHEDIR.TAG' -exec rm -rf {} + 2>/dev/null || true
fi

printf '[tlao-snappymail] Applied TLÁO branding theme %s\n' "$brand_theme"
