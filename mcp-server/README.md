# Shannon Helper MCP Server (No API Keys)

This folder now includes a **vendor-neutral stdio MCP server** that works locally and requires **no API keys**.

## What this gives you

A local MCP server named `shannon-helper` with two tools:

- `save_deliverable` - save validated Shannon deliverable files
- `generate_totp` - generate 6-digit TOTP codes from a base32 secret

These tools are local utility tools only. They do not call Anthropic/OpenAI/Gemini and do not require paid credentials.

## Important limitation

The full Shannon autonomous pentesting pipeline still uses Anthropic Agent SDK model calls in the main app. This MCP server makes the helper tools portable across clients, but it does not make full end-to-end autonomous pentesting keyless.

## Run locally

From repo root:

```bash
chmod +x ./scripts/run-shannon-helper-mcp.sh
./scripts/run-shannon-helper-mcp.sh
```

Environment variable:

- `SHANNON_TARGET_DIR` (optional): base directory where `deliverables/` is written. Defaults to repo root.

## Build-only path

```bash
cd mcp-server
npm install
npm run build
node ./dist/stdio-server.js --target-dir=/absolute/path
```

## Client config templates

Use examples in:

- `mcp-configs/vscode.mcp.json`
- `mcp-configs/cursor.mcp.json`
- `mcp-configs/claude-code.mcp.json`
- `mcp-configs/antigravity.mcp.json`
- `mcp-configs/opencode.mcp.json`

Set the `command` path to this repository on your machine if it differs.
