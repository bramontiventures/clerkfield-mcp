#!/usr/bin/env node
// Clerkfield MCP server (stdio). Gives AI assistants three tools backed by the Clerkfield REST API:
// verify_business, search_liens and get_coverage. Needs a Clerkfield API key in CLERKFIELD_API_KEY.
// Docs: https://clerkfield.com/docs#mcp · Remote version (no install): https://clerkfield.com/mcp
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from "node:module";

const { version } = createRequire(import.meta.url)("./package.json");
const BASE = (process.env.CLERKFIELD_BASE_URL ?? "https://clerkfield.com").replace(/\/+$/, "");
const KEY = process.env.CLERKFIELD_API_KEY ?? "";

/** Calls the Clerkfield API. Returns { ok, status, body }. */
export async function api(path, params = {}, { key = KEY, base = BASE, fetchImpl = fetch } = {}) {
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const res = await fetchImpl(url, {
    headers: { accept: "application/json", "user-agent": `clerkfield-mcp/${version}`, ...(key ? { authorization: `Bearer ${key}` } : {}) },
    signal: AbortSignal.timeout(90_000),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

const text = (t) => ({ content: [{ type: "text", text: t }] });
const result = (summary, value) => text(`${summary}\n\n${JSON.stringify(value, null, 2)}`);
const fail = (t) => ({ ...text(t), isError: true });

function errorMessage(r, what) {
  if (r.status === 401) return "The Clerkfield API key is missing or invalid. Set CLERKFIELD_API_KEY (create a key at https://clerkfield.com/app#profile).";
  if (r.status === 422) return `${r.body.error ?? `That state isn't covered for ${what} yet.`}${r.body.supported ? ` Covered: ${r.body.supported.join(", ")}.` : ""}`;
  if (r.status === 502) return "The state's records couldn't be reached right now. Try again shortly; Clerkfield never answers with stale or guessed data.";
  return `Clerkfield API error ${r.status}: ${r.body.error ?? "unexpected response"}`;
}

/** Coverage rows from the public /v1/coverage endpoint, in the same shape as the remote server. */
export function coverageRows(raw) {
  const built = (b) => b === "built";
  return raw.map((s) => ({
    state: s.code,
    name: s.name,
    businessCheck: built(s.registry?.built),
    lienSearch: built(s.lien?.built),
    lenderSearch: built(s.lien?.built) && s.lien?.securedPartySearch === true,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Builds the server. Coverage is read once at start so tool descriptions list the states covered today. */
export async function createServer(opts = {}) {
  let rows = [];
  try {
    const r = await api("/v1/coverage", {}, opts);
    if (r.ok && Array.isArray(r.body)) rows = coverageRows(r.body);
  } catch { /* offline: descriptions fall back to "see get_coverage" */ }
  const list = (pick) => rows.filter(pick).map((r) => r.state).join(", ") || "see get_coverage";

  const server = new McpServer({ name: "clerkfield", title: "Clerkfield", version, websiteUrl: "https://clerkfield.com" }, {
    instructions:
      "Clerkfield verifies U.S. businesses against official state registries and searches UCC lien filings. " +
      "Results are business records with their official source and date. Clerkfield is not a consumer reporting agency: " +
      "never use results to decide an individual's eligibility for credit, employment, housing or insurance. " +
      "Call get_coverage first if you're unsure whether a state is covered.",
  });

  server.registerTool("verify_business", {
    title: "Verify a business",
    description:
      "Check a U.S. business against the official registry of the state it was formed in. Returns a verdict " +
      "(pass, review or fail) with flags explaining why (name match, active status, months in business, whether the owner is listed), " +
      `plus the state's record: legal name, entity id, status, formation date, addresses, registered agent and officers. Covered states: ${list((r) => r.businessCheck)}.`,
    inputSchema: {
      name: z.string().min(1).describe("Business name, as the applicant gave it"),
      state: z.string().length(2).describe("Two-letter state code where the business was formed, e.g. NY"),
      owner: z.string().optional().describe("Applicant's name, checked against the officers the state lists"),
      min_months: z.number().int().min(0).optional().describe("Minimum months in business (default 6)"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async ({ name, state, owner, min_months }) => {
    const r = await api("/v1/business-check", { name, state: state.toUpperCase(), owner, min_months }, opts);
    if (!r.ok) return fail(errorMessage(r, "business checks"));
    const b = r.body;
    const who = b.match ? `${b.match.legalName} (${b.match.state} #${b.match.entityId})` : `"${name}" in ${state.toUpperCase()}`;
    return result(`Verdict: ${String(b.verdict).toUpperCase()} for ${who}. ${(b.flags ?? []).map((f) => f.message).join(" ")}`.trim(), b);
  });

  server.registerTool("search_liens", {
    title: "Search UCC liens",
    description:
      "List UCC financing statements filed against a business (debtor) or filed by a lender (secured party), newest first, " +
      "with a summary of active, lapsed and terminated filings and the lenders on active filings. Each filing has its file number, " +
      `dates, status, parties, collateral and later amendments. Covered states: ${list((r) => r.lienSearch)}; search by lender in ${list((r) => r.lenderSearch)}.`,
    inputSchema: {
      state: z.string().length(2).describe("Two-letter state code, e.g. FL"),
      debtor: z.string().optional().describe("Business name to search (give debtor or secured_party)"),
      secured_party: z.string().optional().describe("Lender name to search"),
      active_only: z.boolean().optional().describe("Only active filings (default false)"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async ({ state, debtor, secured_party, active_only }) => {
    if (!debtor && !secured_party) return fail("Give either debtor (a business name) or secured_party (a lender name).");
    const r = await api("/v1/liens", { state: state.toUpperCase(), ...(secured_party ? { secured_party } : { debtor }), include_inactive: active_only ? "false" : undefined }, opts);
    if (!r.ok) return fail(errorMessage(r, "lien search"));
    const s = r.body.summary ?? {};
    return result(`${s.total} filings in ${state.toUpperCase()} (${s.active} active, ${s.lapsed} lapsed, ${s.terminated} terminated).` +
      (s.activeSecuredParties?.length ? ` Lenders on active filings: ${s.activeSecuredParties.join(", ")}.` : "") +
      (s.notPublished?.length ? ` Not published by this state: ${s.notPublished.join(", ")}.` : ""), r.body);
  });

  server.registerTool("get_coverage", {
    title: "Get coverage",
    description: "Which U.S. states each check covers (business check, lien search, search by lender).",
    inputSchema: { state: z.string().length(2).optional().describe("Two-letter state code; omit for every state") },
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ state }) => {
    const r = await api("/v1/coverage", {}, opts);
    if (!r.ok || !Array.isArray(r.body)) return fail(errorMessage(r, "coverage"));
    const all = coverageRows(r.body);
    const out = state ? all.filter((x) => x.state === state.toUpperCase()) : all;
    if (state && out.length === 0) return fail(`${state} isn't a U.S. state code.`);
    return result(state ? `Coverage for ${out[0].name}.` : `${all.filter((x) => x.businessCheck || x.lienSearch).length} states have at least one check.`, out);
  });

  return server;
}

// Run as a stdio server when executed directly (npx clerkfield-mcp).
const direct = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
const viaBin = process.argv[1]?.endsWith("clerkfield-mcp");
if (direct || viaBin) {
  if (!KEY) console.error("clerkfield-mcp: CLERKFIELD_API_KEY is not set; tools other than get_coverage will fail. Create a key at https://clerkfield.com/app#profile");
  const server = await createServer();
  await server.connect(new StdioServerTransport());
}
