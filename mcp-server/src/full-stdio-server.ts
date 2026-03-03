import { spawn } from 'node:child_process';
import path from 'node:path';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const StartScanSchema = {
  url: z.string().min(1),
  repo: z.string().min(1),
  workspace: z.string().optional(),
  config: z.string().optional(),
  output: z.string().optional(),
  pipeline_testing: z.boolean().optional(),
  rebuild: z.boolean().optional(),
  use_local_ollama: z.boolean().optional(),
  ollama_model: z.string().optional(),
  ollama_base_url: z.string().optional(),
};

const QuerySchema = {
  id: z.string().min(1),
};

const LogsSchema = {
  id: z.string().optional(),
};

const StopSchema = {
  clean: z.boolean().optional(),
};

function getArgValue(flag: string): string | undefined {
  const arg = process.argv.find((item) => item.startsWith(`${flag}=`));
  if (!arg) {
    return undefined;
  }
  const [, value] = arg.split('=', 2);
  return value;
}

function getRepoRoot(): string {
  const argValue = getArgValue('--repo-root');
  const envValue = process.env.SHANNON_REPO_ROOT;
  const value = argValue || envValue || path.resolve(process.cwd(), '..');
  return path.resolve(value);
}

async function runShannonCommand(repoRoot: string, args: string[], env: NodeJS.ProcessEnv = {}): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn('./shannon', args, {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let combined = '';

    child.stdout.on('data', (chunk) => {
      combined += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      combined += chunk.toString();
    });

    child.on('close', (code) => {
      resolve({
        ok: code === 0,
        output: combined.trim(),
      });
    });
  });
}

function createTextResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

async function main(): Promise<void> {
  const repoRoot = getRepoRoot();

  const server = new McpServer({
    name: 'shannon-full',
    version: '1.0.0',
  });

  server.tool(
    'shannon_start_scan',
    'Start a full Shannon security scan (defensive use on authorized targets only).',
    StartScanSchema,
    async (args) => {
      const startArgs: string[] = ['start', `URL=${args.url}`, `REPO=${args.repo}`];

      if (args.workspace) {
        startArgs.push(`WORKSPACE=${args.workspace}`);
      }
      if (args.config) {
        startArgs.push(`CONFIG=${args.config}`);
      }
      if (args.output) {
        startArgs.push(`OUTPUT=${args.output}`);
      }
      if (args.pipeline_testing) {
        startArgs.push('PIPELINE_TESTING=true');
      }
      if (args.rebuild) {
        startArgs.push('REBUILD=true');
      }

      const env: NodeJS.ProcessEnv = {};

      if (args.use_local_ollama) {
        startArgs.push('ROUTER=true');
        env.OLLAMA_LOCAL = 'true';
        env.ROUTER_DEFAULT = `ollama,${args.ollama_model || process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b'}`;
        env.OLLAMA_BASE_URL = args.ollama_base_url || process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434/v1/chat/completions';
      }

      const result = await runShannonCommand(repoRoot, startArgs, env);

      if (!result.ok) {
        return createTextResult({
          status: 'error',
          message: 'Failed to start Shannon scan',
          output: result.output,
        });
      }

      return createTextResult({
        status: 'success',
        message: 'Shannon scan started',
        output: result.output,
      });
    }
  );

  server.tool(
    'shannon_query',
    'Query workflow status by workflow ID.',
    QuerySchema,
    async (args) => {
      const result = await runShannonCommand(repoRoot, ['query', `ID=${args.id}`]);
      return createTextResult({
        status: result.ok ? 'success' : 'error',
        output: result.output,
      });
    }
  );

  server.tool(
    'shannon_logs',
    'Get Shannon logs (optionally for a workflow ID).',
    LogsSchema,
    async (args) => {
      const commandArgs = ['logs'];
      if (args.id) {
        commandArgs.push(`ID=${args.id}`);
      }

      const result = await runShannonCommand(repoRoot, commandArgs);
      return createTextResult({
        status: result.ok ? 'success' : 'error',
        output: result.output,
      });
    }
  );

  server.tool(
    'shannon_workspaces',
    'List Shannon workspaces and resumable runs.',
    {},
    async () => {
      const result = await runShannonCommand(repoRoot, ['workspaces']);
      return createTextResult({
        status: result.ok ? 'success' : 'error',
        output: result.output,
      });
    }
  );

  server.tool(
    'shannon_stop',
    'Stop Shannon services. Optionally set clean=true for full cleanup.',
    StopSchema,
    async (args) => {
      const commandArgs = ['stop'];
      if (args.clean) {
        commandArgs.push('CLEAN=true');
      }

      const result = await runShannonCommand(repoRoot, commandArgs);
      return createTextResult({
        status: result.ok ? 'success' : 'error',
        output: result.output,
      });
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`shannon-full-mcp failed to start: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});