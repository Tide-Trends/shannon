#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_DIR="$ROOT_DIR/mcp-server"
TARGET_DIR="${SHANNON_TARGET_DIR:-$ROOT_DIR}"

cd "$MCP_DIR"

if [ ! -d node_modules ]; then
  npm install
fi

npm run build >/dev/null
exec node ./dist/stdio-server.js --target-dir="$TARGET_DIR"
