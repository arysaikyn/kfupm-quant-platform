#!/usr/bin/env bash
# One command for local development: Vibe-Trading + backend proxy + web.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/.dev"
mkdir -p "$LOG_DIR"

# Local defaults; override in backend/.env or the shell.
if [[ -f "$ROOT/backend/.env" ]]; then
  set -a; # shellcheck disable=SC1091
  source "$ROOT/backend/.env"; set +a
fi
if [[ -f "$ROOT/backend/.env.upstream" ]]; then
  set -a; # shellcheck disable=SC1091
  source "$ROOT/backend/.env.upstream"; set +a
fi

API_AUTH_KEY="${API_AUTH_KEY:-dev-key}"
export API_AUTH_KEY
export VIBE_API_URL="${VIBE_API_URL:-http://127.0.0.1:8899}"
export VIBE_API_KEY="$API_AUTH_KEY"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
WEB_PORT="${WEB_PORT:-5177}"
VIBE_BIN="${VIBE_BIN:-$HOME/.venvs/vibe-trading/bin/vibe-trading}"
if [[ ! -x "$VIBE_BIN" && -x /tmp/vt-venv/bin/vibe-trading ]]; then
  VIBE_BIN=/tmp/vt-venv/bin/vibe-trading
fi

LANGCHAIN_PROVIDER="${LANGCHAIN_PROVIDER:-openai}"
LANGCHAIN_MODEL_NAME="${LANGCHAIN_MODEL_NAME:-deepseek-v4.1-flash}"
OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://opencode.ai/zen/go/v1}"
if [[ -z "${OPENAI_API_KEY:-}" ]] && command -v security >/dev/null 2>&1; then
  # Dev convenience only; the key is never printed or written to a file.
  OPENAI_API_KEY="$(security find-generic-password -a "$USER" -s "${DEV_KEYCHAIN_ITEM:-OPENCODE_GO_API_KEY_2}" -w 2>/dev/null || true)"
fi
export LANGCHAIN_PROVIDER LANGCHAIN_MODEL_NAME OPENAI_BASE_URL OPENAI_API_KEY

vibe_pid=""
backend_pid=""
web_pid=""
reused_vibe=0
reused_backend=0

cleanup() {
  trap - INT TERM EXIT
  [[ -n "$web_pid" ]] && kill "$web_pid" 2>/dev/null || true
  [[ -n "$backend_pid" ]] && kill "$backend_pid" 2>/dev/null || true
  [[ -n "$vibe_pid" ]] && kill "$vibe_pid" 2>/dev/null || true
  wait 2>/dev/null || true
  echo
  echo "dev: stopped"
}
trap cleanup INT TERM EXIT

need() { command -v "$1" >/dev/null 2>&1 || { echo "dev: missing $1"; exit 1; }; }
need uv
need node
need npm
need curl
[[ -x "$VIBE_BIN" ]] || {
  echo "dev: Vibe-Trading not found at $VIBE_BIN"
  echo "  uv venv ~/.venvs/vibe-trading --python 3.12"
  echo "  uv pip install --python ~/.venvs/vibe-trading/bin/python 'vibe-trading-ai==0.1.18'"
  echo "  or set VIBE_BIN=/path/to/vibe-trading"
  exit 1
}
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "dev: no model key. Put OPENAI_API_KEY in backend/.env.upstream,"
  echo "     export it, or set DEV_KEYCHAIN_ITEM to a Keychain item name."
  exit 1
fi

up() { curl -fsS -o /dev/null --max-time 1 "$1" >/dev/null 2>&1; }
vibe_up() { curl -fsS -o /dev/null --max-time 1 -H "Authorization: Bearer $API_AUTH_KEY" "$VIBE_API_URL/sessions?limit=1" >/dev/null 2>&1; }

wait_for() {
  local name="$1" check="$2" tries="${3:-90}"
  for _ in $(seq 1 "$tries"); do
    if eval "$check"; then return 0; fi
    sleep 1
  done
  echo "dev: $name did not become ready"; return 1
}

if vibe_up; then
  echo "dev: reusing Vibe-Trading on $VIBE_API_URL"
  reused_vibe=1
else
  if curl -fsS -o /dev/null --max-time 1 "$VIBE_API_URL/" >/dev/null 2>&1; then
    echo "dev: $VIBE_API_URL is occupied but not answering with API_AUTH_KEY=$API_AUTH_KEY"
    exit 1
  fi
  echo "dev: starting Vibe-Trading on $VIBE_API_URL"
  ( cd /tmp && exec "$VIBE_BIN" serve --host 127.0.0.1 --port 8899 ) \
    >"$LOG_DIR/vibe.log" 2>&1 &
  vibe_pid=$!
  wait_for "Vibe-Trading" "vibe_up" 90 || { tail -30 "$LOG_DIR/vibe.log"; exit 1; }
fi

if up "$BACKEND_URL/api/ai/health"; then
  echo "dev: reusing backend on $BACKEND_URL"
  reused_backend=1
else
  if curl -fsS -o /dev/null --max-time 1 "$BACKEND_URL/" >/dev/null 2>&1; then
    echo "dev: $BACKEND_URL is occupied by something else"
    exit 1
  fi
  echo "dev: starting backend on $BACKEND_URL"
  ( cd "$ROOT/backend" && exec ./run.sh ) >"$LOG_DIR/backend.log" 2>&1 &
  backend_pid=$!
  wait_for "backend" "up '$BACKEND_URL/api/ai/health'" 60 || { tail -30 "$LOG_DIR/backend.log"; exit 1; }
fi

if curl -fsS -o /dev/null --max-time 1 "http://localhost:$WEB_PORT/" >/dev/null 2>&1; then
  echo "dev: port $WEB_PORT is already serving; reusing it"
else
  echo "dev: starting web on http://localhost:$WEB_PORT"
  ( cd "$ROOT/web" && BACKEND_URL="$BACKEND_URL" exec npm run dev -- --port "$WEB_PORT" --strictPort ) \
    >"$LOG_DIR/web.log" 2>&1 &
  web_pid=$!
  wait_for "web" "up 'http://localhost:$WEB_PORT/'" 60 || { tail -30 "$LOG_DIR/web.log"; exit 1; }
fi

cat <<MSG

  dev ready
  web       http://localhost:$WEB_PORT
  ai api    $BACKEND_URL/api/ai/health
  upstream  $VIBE_API_URL  (model: $LANGCHAIN_MODEL_NAME)
  logs      $LOG_DIR/{vibe,backend,web}.log
  stop      Ctrl-C

MSG

if [[ "${DEV_OPEN:-1}" != "0" ]] && command -v open >/dev/null 2>&1; then
  open "http://localhost:$WEB_PORT"
fi

# Keep the trap alive while the foreground services run.
while true; do
  if [[ -n "$vibe_pid" ]] && ! kill -0 "$vibe_pid" 2>/dev/null; then echo "dev: Vibe-Trading exited"; exit 1; fi
  if [[ -n "$backend_pid" ]] && ! kill -0 "$backend_pid" 2>/dev/null; then echo "dev: backend exited"; exit 1; fi
  if [[ -n "$web_pid" ]] && ! kill -0 "$web_pid" 2>/dev/null; then echo "dev: web exited"; exit 1; fi
  sleep 2
done
