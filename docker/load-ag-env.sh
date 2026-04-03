#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

keychain_value() {
  security find-generic-password -a "$USER" -s "$1" -w
}

export AG_MARS_DB_HOST="${AG_MARS_DB_HOST:-$(keychain_value com.shuotu.mars.db.host)}"
export AG_MARS_DB_PORT="${AG_MARS_DB_PORT:-$(keychain_value com.shuotu.mars.db.port)}"
export AG_MARS_DB_USER="${AG_MARS_DB_USER:-$(keychain_value com.shuotu.mars.db.user)}"
export AG_MARS_DB_PASS="${AG_MARS_DB_PASS:-$(keychain_value com.shuotu.mars.db.pass)}"
export AG_MARS_DB_NAME="${AG_MARS_DB_NAME:-$(keychain_value com.shuotu.mars.db.name)}"
export AG_MARS_DB_CHARSET="${AG_MARS_DB_CHARSET:-$(keychain_value com.shuotu.mars.db.charset)}"
export AG_AUTH_SECRET="${AG_AUTH_SECRET:-$(keychain_value com.shuotu.ag.auth.secret)}"

export AG_MODEL_PROVIDER="${AG_MODEL_PROVIDER:-$(keychain_value com.shuotu.ag.model.provider)}"
export AG_MODEL_API_KEY="${AG_MODEL_API_KEY:-$(keychain_value com.shuotu.ag.model.api_key)}"
export AG_MODEL_ID="${AG_MODEL_ID:-$(keychain_value com.shuotu.ag.model.id)}"
export AG_API_BASE="${AG_API_BASE:-http://localhost:3000/api}"

cd "$SCRIPT_DIR"

if [[ "$#" -eq 0 ]]; then
  exec docker compose up -d
fi

if [[ "$1" == "--" ]]; then
  shift
  exec "$@"
fi

exec docker compose "$@"
