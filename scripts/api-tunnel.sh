#!/usr/bin/env bash
# Exposes the local API through a Cloudflare quick tunnel and prints the public URL.
# Needs cloudflared on PATH (installed to ~/.local/bin). The URL changes every time
# the tunnel starts; account-less tunnels have no uptime guarantee. Ctrl+C stops it.
set -euo pipefail
PORT="${1:-4000}"
LOG="$(mktemp)"
cleanup() { kill "$PID" 2>/dev/null || true; rm -f "$LOG"; }
trap cleanup EXIT
cloudflared tunnel --url "http://localhost:${PORT}" --no-autoupdate >"$LOG" 2>&1 &
PID=$!
for _ in $(seq 1 30); do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done
if [ -z "${URL:-}" ]; then echo "Tunnel did not come up:"; cat "$LOG"; exit 1; fi
echo "API is public at: $URL"
echo "Use it as EXPO_PUBLIC_API_URL for a mobile build, or paste it into the GitHub workflow's API field."
echo "Tunnel is running; press Ctrl+C to stop."
wait "$PID"
