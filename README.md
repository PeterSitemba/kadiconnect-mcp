# KadiConnect MCP

[Model Context Protocol](https://modelcontextprotocol.io) server for [KadiConnect](https://kadiconnect.com). Lets an AI assistant create and manage a digital business card, create tracked links per outreach channel, and read analytics.

KadiConnect hosts the server at **`https://kadiconnect.com/mcp`** (Streamable HTTP). You can connect to it directly, or run this package, a small stdio bridge to the same hosted server, for clients that only launch local commands.

## Tools

| Tool | What it does |
| --- | --- |
| `register` | Create an account and receive an API key (no key needed to call it) |
| `get_card` | Read the account's business card and its public URL |
| `create_or_update_card` | Create the card or change any field (partial updates) |
| `create_shareable_link` | Create a tracked link with its own view counter |
| `get_shareable_links` | List tracked links with URLs and view counts |
| `get_analytics` | Views, saves, saves to contacts, clicks by link type |
| `get_subscription` | Plan, and how many of the 50 free views are used |
| `get_upgrade_link` | Return a Paystack checkout link for the user to open and pay. Charges nothing itself |

## Get an API key

Create one at <https://kadiconnect.com/profile#api-keys> (Manage Profile, Developer API keys), or call the `register` tool to create an account. Keys start with `kc_`, are shown once, and should be treated like passwords.

## Connect directly (recommended)

Claude Code:

```bash
claude mcp add --transport http kadiconnect https://kadiconnect.com/mcp \
  --header "Authorization: Bearer kc_YOUR_KEY"
```

Cursor (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "kadiconnect": {
      "url": "https://kadiconnect.com/mcp",
      "headers": { "Authorization": "Bearer kc_YOUR_KEY" }
    }
  }
}
```

VS Code (`.vscode/mcp.json`):

```json
{
  "servers": {
    "kadiconnect": {
      "type": "http",
      "url": "https://kadiconnect.com/mcp",
      "headers": { "Authorization": "Bearer kc_YOUR_KEY" }
    }
  }
}
```

Gemini CLI (`settings.json`):

```json
{
  "mcpServers": {
    "kadiconnect": {
      "httpUrl": "https://kadiconnect.com/mcp",
      "headers": { "Authorization": "Bearer kc_YOUR_KEY" }
    }
  }
}
```

Config formats change between client versions. If a snippet does not match, check your client's MCP documentation; the server URL and bearer header are all it needs.

## Use this package (stdio)

For clients that launch a local command, such as Claude Desktop:

```json
{
  "mcpServers": {
    "kadiconnect": {
      "command": "npx",
      "args": ["-y", "@kadiconnect/mcp"],
      "env": { "KADICONNECT_API_KEY": "kc_YOUR_KEY" }
    }
  }
}
```

| Variable | Description |
| --- | --- |
| `KADICONNECT_API_KEY` | Your API key. Optional: without it only `register` works, and other tools accept an `apiKey` argument |
| `KADICONNECT_MCP_URL` | Override the server URL (default `https://kadiconnect.com/mcp`) |

## Plans

The free plan shows a card for its first 50 views; after that, visitors see an upgrade screen. Pro ($4/month, $30/year or $99 one-time) removes the limit. Payment is always completed by the account owner in the browser: `get_upgrade_link` only returns a hosted checkout link.

## More

- Developer docs: <https://kadiconnect.com/developers>
- REST API (OpenAPI): <https://kadiconnect.com/openapi.json>
- Contact: <https://kadiconnect.com/contact>

## License

MIT
