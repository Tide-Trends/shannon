# Shannon Helper MCP (No-Key Setup)

This is a local stdio MCP server.

No paid API keys needed.

## Tools

- `save_deliverable`
- `generate_totp`

## Run

From repo root:

```bash
chmod +x ./scripts/run-shannon-helper-mcp.sh
./scripts/run-shannon-helper-mcp.sh
```

Optional env:

```text
SHANNON_TARGET_DIR=/absolute/path/to/project
```

## MCP client config

Use command:

```text
/absolute/path/to/shannon/scripts/run-shannon-helper-mcp.sh
```

Ready templates are in `mcp-configs/`.

## One-line test

```bash
cd mcp-server && npm install && npm run build
```

Then run an MCP client and check it lists:

- `save_deliverable`
- `generate_totp`