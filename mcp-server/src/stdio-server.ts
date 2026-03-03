import fs from 'node:fs';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DeliverableType, DELIVERABLE_FILENAMES, isQueueType } from './types/deliverables.js';
import { validateQueueJson } from './validation/queue-validator.js';
import { validateTotpSecret, base32Decode } from './validation/totp-validator.js';
import { saveDeliverableFile } from './utils/file-operations.js';

const SaveDeliverableSchema = {
  deliverable_type: z.enum(Object.values(DeliverableType) as [string, ...string[]]),
  content: z.string().min(1).optional(),
  file_path: z.string().optional(),
};

const GenerateTotpSchema = {
  secret: z.string().min(1).regex(/^[A-Z2-7]+$/i, 'Must be base32-encoded'),
};

function getArgValue(flag: string): string | undefined {
  const arg = process.argv.find((item) => item.startsWith(`${flag}=`));
  if (!arg) {
    return undefined;
  }
  const [, value] = arg.split('=', 2);
  return value;
}

function getTargetDir(): string {
  const argValue = getArgValue('--target-dir');
  const envValue = process.env.SHANNON_TARGET_DIR;
  const value = argValue || envValue || process.cwd();
  return path.resolve(value);
}

function isPathContained(basePath: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(basePath);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(resolvedBase + path.sep);
}

function resolveContent(args: { content?: string | undefined; file_path?: string | undefined }, targetDir: string): string {
  if (args.content) {
    return args.content;
  }

  if (!args.file_path) {
    throw new Error('Either "content" or "file_path" must be provided');
  }

  const resolvedPath = path.isAbsolute(args.file_path)
    ? args.file_path
    : path.resolve(targetDir, args.file_path);

  if (!isPathContained(targetDir, resolvedPath)) {
    throw new Error(`Path "${args.file_path}" resolves outside allowed directory`);
  }

  return fs.readFileSync(resolvedPath, 'utf-8');
}

function generateHOTP(secret: string, counter: number, digits: number = 6): string {
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', key);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1]! & 0x0f;
  const code =
    ((hash[offset]! & 0x7f) << 24) |
    ((hash[offset + 1]! & 0xff) << 16) |
    ((hash[offset + 2]! & 0xff) << 8) |
    (hash[offset + 3]! & 0xff);

  return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
}

function generateTOTP(secret: string, timeStep: number = 30, digits: number = 6): string {
  const currentTime = Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentTime / timeStep);
  return generateHOTP(secret, counter, digits);
}

function getSecondsUntilExpiration(timeStep: number = 30): number {
  const currentTime = Math.floor(Date.now() / 1000);
  return timeStep - (currentTime % timeStep);
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
  const targetDir = getTargetDir();

  const server = new McpServer({
    name: 'shannon-helper',
    version: '1.0.0',
  });

  server.tool(
    'save_deliverable',
    'Saves Shannon deliverable files. Queue file types require JSON with {"vulnerabilities": [...]}',
    SaveDeliverableSchema,
    async (args) => {
      try {
        const content = resolveContent(args, targetDir);

        if (isQueueType(args.deliverable_type)) {
          const queueValidation = validateQueueJson(content);
          if (!queueValidation.valid) {
            return createTextResult({
              status: 'error',
              errorType: 'ValidationError',
              retryable: true,
              message: queueValidation.message ?? 'Invalid queue JSON',
            });
          }
        }

        const filename = DELIVERABLE_FILENAMES[args.deliverable_type as DeliverableType];
        const filepath = saveDeliverableFile(targetDir, filename, content);

        return createTextResult({
          status: 'success',
          message: `Deliverable saved successfully: ${filename}`,
          filepath,
          deliverableType: args.deliverable_type,
          validated: isQueueType(args.deliverable_type),
        });
      } catch (error) {
        return createTextResult({
          status: 'error',
          errorType: 'FileSystemError',
          retryable: false,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  server.tool(
    'generate_totp',
    'Generates a 6-digit TOTP code from a base32 secret',
    GenerateTotpSchema,
    async (args) => {
      try {
        validateTotpSecret(args.secret);
        const totpCode = generateTOTP(args.secret);
        const expiresIn = getSecondsUntilExpiration();

        return createTextResult({
          status: 'success',
          message: 'TOTP code generated successfully',
          totpCode,
          timestamp: new Date().toISOString(),
          expiresIn,
        });
      } catch (error) {
        return createTextResult({
          status: 'error',
          errorType: 'CryptoError',
          retryable: false,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`shannon-helper-mcp failed to start: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
