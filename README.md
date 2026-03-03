# Shannon Full MCP (Simple + No Claude/OpenAI Keys)

Use Shannon as an MCP server so your AI tool can run full security scans from chat.

## What you get

- Full Shannon controls as MCP tools:
  - `shannon_start_scan`
  - `shannon_query`
  - `shannon_logs`
  - `shannon_workspaces`
  - `shannon_stop`
- Local-model path using **Ollama** (no Anthropic/OpenAI/Gemini API keys)

> Defensive security only: only test systems you own or are explicitly authorized to test.

## 60-second setup

1. Install/start Ollama and pull a model:

```bash
brew install ollama
ollama serve
ollama pull qwen2.5-coder:14b
```

2. Clone this repo and make the launcher executable:

```bash
git clone https://github.com/Tide-Trends/shannon.git
cd shannon
chmod +x ./scripts/run-shannon-full-mcp.sh
```

3. In your AI client MCP config, set command to:

```text
/absolute/path/to/shannon/scripts/run-shannon-full-mcp.sh
```

4. Add env values:

```text
OLLAMA_LOCAL=true
OLLAMA_MODEL=qwen2.5-coder:14b
OLLAMA_BASE_URL=http://host.docker.internal:11434/v1/chat/completions
```

Ready templates are in `mcp-configs/`.

## Copy/paste prompt for any AI tool

Use this exact prompt in VS Code/Cursor/Claude Code/Antigravity/OpenCode:

```text
Set up Shannon Full MCP for this machine.

1) Use MCP command: /absolute/path/to/shannon/scripts/run-shannon-full-mcp.sh
2) Set env:
   OLLAMA_LOCAL=true
   OLLAMA_MODEL=qwen2.5-coder:14b
   OLLAMA_BASE_URL=http://host.docker.internal:11434/v1/chat/completions
3) Confirm the server exposes tools:
   shannon_start_scan, shannon_query, shannon_logs, shannon_workspaces, shannon_stop
4) Start a scan with shannon_start_scan against my authorized target.
```

## Minimal usage

Start scan:

- `shannon_start_scan` with:
  - `url`: target URL
  - `repo`: folder name under `./repos/`
  - optional `workspace`, `config`, `output`
  - optional `use_local_ollama=true`

Monitor:

- `shannon_logs`
- `shannon_query`
- `shannon_workspaces`

Stop:

- `shannon_stop` (or `clean=true`)

## Important note

This path removes Claude/OpenAI keys, but Shannon still needs a local LLM endpoint (Ollama) for reasoning.