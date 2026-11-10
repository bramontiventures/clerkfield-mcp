# Clerkfield MCP server

Verify U.S. businesses against official state registries and search UCC liens, from Claude, Cursor, VS Code, Windsurf and any other [Model Context Protocol](https://modelcontextprotocol.io) client.

[Clerkfield](https://clerkfield.com) reads each state's own business registry and UCC filing office, not a resold database, and returns every result with its official source and the date of the data. It's built for merchant cash advance funders, lenders and anyone doing KYB on U.S. businesses.

<!-- mcp-name: com.clerkfield/mcp -->

## Tools

| Tool | What it does |
|---|---|
| `verify_business` | Checks a business against the registry of the state it was formed in. Returns **pass**, **review** or **fail** with flags explaining why (name match, active status, months in business, whether the owner is listed) and the state's record: legal name, entity id, status, formation date, addresses, registered agent and officers. |
| `search_liens` | Lists UCC financing statements filed against a business (debtor) or by a lender (secured party), newest first, with a summary of active, lapsed and terminated filings and the lenders on active filings. Each filing has its file number, dates, parties, collateral and later amendments. |
| `get_coverage` | Which states each check covers today. Tool descriptions are built from it at start-up, so they always list the states covered right now. |

All tools are read-only.

## Get an API key

Create a free account at [clerkfield.com/app](https://clerkfield.com/app#signup), open your profile and create an API key. Clerkfield is free during the beta.

## Option 1: remote server (no install)

Point your client at `https://clerkfield.com/mcp` (Streamable HTTP) with the header `Authorization: Bearer <your key>`.

**Claude Code**
```bash
claude mcp add --transport http clerkfield https://clerkfield.com/mcp --header "Authorization: Bearer YOUR_KEY"
```

**Cursor / VS Code / Windsurf** (`mcp.json`)
```json
{
  "mcpServers": {
    "clerkfield": {
      "url": "https://clerkfield.com/mcp",
      "headers": { "Authorization": "Bearer YOUR_KEY" }
    }
  }
}
```

## Option 2: local server (npm)

Runs on your machine and calls the Clerkfield API. Needs Node.js 18.17 or later.

**Claude Desktop** (`claude_desktop_config.json`), **Cursor**, **VS Code**, **Windsurf**
```json
{
  "mcpServers": {
    "clerkfield": {
      "command": "npx",
      "args": ["-y", "clerkfield-mcp"],
      "env": { "CLERKFIELD_API_KEY": "YOUR_KEY" }
    }
  }
}
```

**Claude Code**
```bash
claude mcp add clerkfield --env CLERKFIELD_API_KEY=YOUR_KEY -- npx -y clerkfield-mcp
```

**Docker**
```bash
docker build -t clerkfield-mcp .
docker run -i --rm -e CLERKFIELD_API_KEY=YOUR_KEY clerkfield-mcp
```

| Variable | Required | Meaning |
|---|---|---|
| `CLERKFIELD_API_KEY` | Yes | Your Clerkfield API key |
| `CLERKFIELD_BASE_URL` | No | API base URL (default `https://clerkfield.com`) |

## Example prompts

- "Verify Joes Pizza Italia Inc in New York and tell me how long it's been in business."
- "Is Jane Doe listed as an officer of Acme Roofing LLC in Florida?"
- "Show every active UCC lien on Harbor Street Bakery LLC in Connecticut, newest first."
- "Which states can you search UCC liens by lender in?"

## Good to know

- Coverage varies by state and grows over time: ask `get_coverage`, or see [clerkfield.com/coverage](https://clerkfield.com/coverage).
- When a state doesn't publish a field for free, the result says "not published" instead of leaving it blank. When a state's records can't be reached, the tool returns an error, never stale or guessed data.
- Clerkfield reports on businesses only and is **not a consumer reporting agency**. Don't use results to decide an individual's eligibility for credit, employment, housing or insurance ([terms](https://clerkfield.com/terms)).
- Each `verify_business` and `search_liens` call counts as one request on your account.

## Links

- API documentation: [clerkfield.com/docs](https://clerkfield.com/docs) · OpenAPI: [clerkfield.com/openapi.json](https://clerkfield.com/openapi.json)
- Support: [hello@clerkfield.com](mailto:hello@clerkfield.com)

## License

MIT © Bramonti Ventures LLC. This repository contains only the MCP client for the Clerkfield API.
