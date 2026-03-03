# Shannon Helper MCP (No API Keys)

A tiny local MCP server you can use in VS Code, Cursor, Claude Code, Antigravity, and OpenCode.

No Anthropic/OpenAI/Gemini keys required.

## What this gives you

This MCP server exposes 2 local tools:

- `save_deliverable` — saves Shannon-style deliverable files into `deliverables/`
- `generate_totp` — generates 6-digit TOTP codes from a base32 secret

## Install (2 minutes)

1) Clone this repo:

```bash
git clone https://github.com/Tide-Trends/shannon.git
cd shannon
```

2) Make launcher executable:

```bash
chmod +x ./scripts/run-shannon-helper-mcp.sh
```

3) Point your MCP client to:

```text
/absolute/path/to/shannon/scripts/run-shannon-helper-mcp.sh
```

4) Optional env var:

```text
SHANNON_TARGET_DIR=/absolute/path/to/your/project
```

If omitted, it uses the repo root.

## Client config templates

Use and edit these templates:

- `mcp-configs/vscode.mcp.json`
- `mcp-configs/cursor.mcp.json`
- `mcp-configs/claude-code.mcp.json`
- `mcp-configs/antigravity.mcp.json`
- `mcp-configs/opencode.mcp.json`

## Quick proof it works

From this repo:

```bash
cd mcp-server
npm install
npm run build
node --input-type=module -e "import { Client } from '@modelcontextprotocol/sdk/client/index.js'; import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'; const t=new StdioClientTransport({command:'node',args:['./dist/stdio-server.js','--target-dir=' + process.cwd()],cwd:process.cwd()}); const c=new Client({name:'smoke',version:'1.0.0'},{capabilities:{}}); await c.connect(t); console.log((await c.listTools()).tools.map(x=>x.name)); await c.close();"
```

You should see:

- `save_deliverable`
- `generate_totp`

## Important note

This repo originally contains the full Shannon pentest framework, and that full pipeline still uses cloud model credentials.

This fork focuses on the **keyless local MCP helper server** only.