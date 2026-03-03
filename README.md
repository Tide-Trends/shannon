# Shannon MCP (Use Your Current Chat Model)

This setup is for VS Code / Cursor / Claude Code / Antigravity / OpenCode when you want:

- no Anthropic/OpenAI API keys,
- no local model runtime,
- your **currently selected chat model** to do the reasoning.

## Important truth (short version)

The original full Shannon pipeline runs its own model backend, so it cannot directly inherit Cursor’s selected chat model from inside an external process.

This MCP setup gives your AI client Shannon tools (`save_deliverable`, `generate_totp`) and lets your **active chat model** drive the security workflow.

## 1-minute install

1) Clone:

```bash
git clone https://github.com/Tide-Trends/shannon.git
cd shannon
```

2) Make launcher executable:

```bash
chmod +x ./scripts/run-shannon-helper-mcp.sh
```

3) In your MCP config, set:

```text
command: /absolute/path/to/shannon/scripts/run-shannon-helper-mcp.sh
env: SHANNON_TARGET_DIR=/absolute/path/to/target-project
```

Ready templates are in `mcp-configs/`.

## Copy/paste prompt for Cursor (or any AI IDE)

```text
Use my CURRENT selected chat model. Do not call any external model APIs.

Use Shannon MCP tools only:
- save_deliverable
- generate_totp

Target project path: /absolute/path/to/target-project
URL under test: https://example.com

Perform a defensive security assessment (authorized target only):
1) Build recon notes and save with save_deliverable (RECON)
2) Analyze top risks (auth/authz/xss/injection/ssrf)
3) Save findings as Shannon deliverables via save_deliverable
4) Provide remediation checklist with severity and fix priority

Use my currently selected model for all reasoning.
```

## What changed

- Templates now point to `run-shannon-helper-mcp.sh` (chat-model-native mode)
- No local-model env vars required
- No cloud API keys required for this MCP flow