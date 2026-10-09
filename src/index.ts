#!/usr/bin/env node
/**
 * KadiConnect MCP bridge.
 *
 * Speaks MCP over stdio to a local client (Claude Desktop, Cursor, ...) and
 * forwards everything to the hosted KadiConnect MCP server over Streamable
 * HTTP. All tool logic lives on the server, so this package never goes stale.
 *
 * Environment:
 *   KADICONNECT_API_KEY  API key (kc_...). Optional: without it only the
 *                        `register` tool works, and other tools accept an
 *                        `apiKey` argument.
 *   KADICONNECT_MCP_URL  Override the server URL (default https://kadiconnect.com/mcp).
 *
 * stdout is reserved for the MCP protocol; diagnostics go to stderr.
 */
import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const DEFAULT_URL = 'https://kadiconnect.com/mcp';

function packageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const VERSION = packageVersion();

function log(message: string) {
  process.stderr.write(`[kadiconnect-mcp] ${message}\n`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    return;
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      [
        `kadiconnect-mcp ${VERSION}`,
        'MCP stdio bridge to the hosted KadiConnect server.',
        '',
        'Environment:',
        '  KADICONNECT_API_KEY   Your API key (kc_...). Create one at https://kadiconnect.com/profile#api-keys',
        `  KADICONNECT_MCP_URL   Server URL (default ${DEFAULT_URL})`,
        '',
        'Docs: https://kadiconnect.com/developers',
      ].join('\n')
    );
    return;
  }

  const url = process.env.KADICONNECT_MCP_URL || DEFAULT_URL;
  const apiKey = process.env.KADICONNECT_API_KEY?.trim();

  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  // Remote side: Streamable HTTP client.
  const remote = new Client({ name: 'kadiconnect-mcp-bridge', version: VERSION });
  await remote.connect(new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers } }));

  // Local side: stdio server that mirrors the remote tool list and forwards calls.
  const server = new Server(
    { name: 'kadiconnect', version: VERSION },
    { capabilities: { tools: {} }, instructions: remote.getInstructions() }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const { tools } = await remote.listTools();
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await remote.callTool({
      name: request.params.name,
      arguments: request.params.arguments,
    });
  });

  const shutdown = async () => {
    await Promise.allSettled([server.close(), remote.close()]);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await server.connect(new StdioServerTransport());

  if (!apiKey) {
    log('KADICONNECT_API_KEY is not set: only the register tool will work, or pass the apiKey argument to other tools.');
  }
}

main().catch((error) => {
  log(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
