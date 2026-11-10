import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../index.js";

// A fake Clerkfield API: records each request and answers like the real one.
function fakeApi() {
  const calls = [];
  const coverage = [
    { code: "NY", name: "New York", registry: { built: "built" }, lien: { built: "planned", securedPartySearch: "unknown" } },
    { code: "FL", name: "Florida", registry: { built: "built" }, lien: { built: "built", securedPartySearch: true } },
    { code: "GA", name: "Georgia", registry: { built: "planned" }, lien: { built: "planned", securedPartySearch: true } },
  ];
  const fetchImpl = async (url, init) => {
    const u = new URL(url);
    calls.push({ path: u.pathname, params: Object.fromEntries(u.searchParams), auth: init.headers.authorization });
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    if (u.pathname === "/v1/coverage") return reply(200, coverage);
    if (!init.headers.authorization) return reply(401, { error: "no key" });
    if (u.pathname === "/v1/business-check") {
      if (u.searchParams.get("state") === "GA") return reply(422, { error: "GA isn't covered", supported: ["FL", "NY"] });
      return reply(200, { verdict: "pass", matchQuality: "exact", match: { legalName: "JOES PIZZA INC", state: "NY", entityId: "1" }, flags: [] });
    }
    if (u.pathname === "/v1/liens") return reply(200, { summary: { total: 2, active: 1, lapsed: 1, terminated: 0, activeSecuredParties: ["FAST CAPITAL"], notPublished: [] }, filings: [] });
    return reply(404, { error: "not found" });
  };
  return { calls, fetchImpl };
}

async function connect(opts) {
  const server = await createServer(opts);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1" });
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}

test("lists three read-only tools whose descriptions name today's covered states", async () => {
  const { fetchImpl } = fakeApi();
  const client = await connect({ key: "k", base: "https://api.test", fetchImpl });
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ["get_coverage", "search_liens", "verify_business"]);
  const verify = tools.find((t) => t.name === "verify_business");
  assert.match(verify.description, /Covered states: FL, NY\./);
  assert.match(tools.find((t) => t.name === "search_liens").description, /search by lender in FL/);
  for (const t of tools) assert.equal(t.annotations.readOnlyHint, true);
});

test("verify_business calls the API with the key and summarises the verdict", async () => {
  const { calls, fetchImpl } = fakeApi();
  const client = await connect({ key: "k", base: "https://api.test", fetchImpl });
  const r = await client.callTool({ name: "verify_business", arguments: { name: "Joes Pizza", state: "ny", min_months: 12 } });
  assert.match(r.content[0].text, /^Verdict: PASS for JOES PIZZA INC \(NY #1\)/);
  const call = calls.find((c) => c.path === "/v1/business-check");
  assert.deepEqual(call.params, { name: "Joes Pizza", state: "NY", min_months: "12" });
  assert.equal(call.auth, "Bearer k");
});

test("uncovered states and a missing key come back as clear tool errors", async () => {
  const { fetchImpl } = fakeApi();
  const withKey = await connect({ key: "k", base: "https://api.test", fetchImpl });
  const ga = await withKey.callTool({ name: "verify_business", arguments: { name: "Acme", state: "GA" } });
  assert.equal(ga.isError, true);
  assert.match(ga.content[0].text, /GA isn't covered.*Covered: FL, NY/);
  const noKey = await connect({ key: "", base: "https://api.test", fetchImpl });
  const r = await noKey.callTool({ name: "verify_business", arguments: { name: "Acme", state: "NY" } });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /CLERKFIELD_API_KEY/);
});

test("search_liens needs a debtor or lender and passes active_only through", async () => {
  const { calls, fetchImpl } = fakeApi();
  const client = await connect({ key: "k", base: "https://api.test", fetchImpl });
  const none = await client.callTool({ name: "search_liens", arguments: { state: "FL" } });
  assert.equal(none.isError, true);
  const r = await client.callTool({ name: "search_liens", arguments: { state: "fl", secured_party: "Fast Capital", active_only: true } });
  assert.match(r.content[0].text, /2 filings in FL \(1 active, 1 lapsed, 0 terminated\)\. Lenders on active filings: FAST CAPITAL\./);
  assert.deepEqual(calls.at(-1).params, { state: "FL", secured_party: "Fast Capital", include_inactive: "false" });
});

test("get_coverage filters by state", async () => {
  const { fetchImpl } = fakeApi();
  const client = await connect({ key: "", base: "https://api.test", fetchImpl });
  const r = await client.callTool({ name: "get_coverage", arguments: { state: "fl" } });
  assert.match(r.content[0].text, /^Coverage for Florida\./);
  assert.match(r.content[0].text, /"lenderSearch": true/);
});
