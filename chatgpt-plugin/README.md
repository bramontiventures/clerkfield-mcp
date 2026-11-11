# Clerkfield for ChatGPT

Plugin package for the ChatGPT directory. It connects ChatGPT to Clerkfield's remote MCP server (`https://clerkfield.com/mcp`) so you can verify U.S. businesses against official state registries and check their UCC liens for stacking, with the source and date on every result.

- **Tools (read-only):** `verify_business`, `search_liens`, `get_coverage`
- **Skills:** `verify-business`, `check-ucc-liens` (the same workflows as the Claude plugin)
- **Sign-in:** OAuth with Dynamic Client Registration. Users sign in with their free Clerkfield account on clerkfield.com and choose Allow; no API key is needed.

## Data

The plugin sends only what each tool needs (business names, states, lender names and, if given, an applicant's name) to Clerkfield over HTTPS, under the user's account. Clerkfield answers from official state records. See the [privacy policy](https://clerkfield.com/privacy) and [terms](https://clerkfield.com/terms). Clerkfield reports on businesses only and is not a consumer reporting agency.

## Build the upload

From this folder: `zip -r ../dist/clerkfield-chatgpt-plugin.zip . -x README.md` (the ZIP's root holds `plugin.json` and `mcp.json`).

Support: hello@clerkfield.com
