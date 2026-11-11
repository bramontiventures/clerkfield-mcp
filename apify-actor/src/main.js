// Apify Actor for Clerkfield (https://clerkfield.com): a thin client of Clerkfield's public REST API.
// It never scrapes: every check goes to Clerkfield, which answers from official state records and
// returns the source and data date. Users bring their own Clerkfield API key (free during the beta).
import { Actor, log } from 'apify';

const BASE = 'https://clerkfield.com';

async function call(path, apiKey) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
}

// Business checks carry the source on match.source; lien searches on each filing. Source = { name, url, asOf? }.
function sourceOf(body) {
    const s = body?.match?.source ?? body?.filings?.[0]?.source;
    if (!s) return undefined;
    return [s.name, s.asOf ? `data as of ${s.asOf}` : undefined, s.url].filter(Boolean).join(' · ');
}

await Actor.init();
const input = (await Actor.getInput()) ?? {};
const { operation = 'verifyBusiness', apiKey } = input;

if (operation !== 'coverage' && !apiKey) {
    await Actor.fail('Add your Clerkfield API key (create one free at https://clerkfield.com/app#profile).');
}

if (operation === 'coverage') {
    const { status, body } = await call('/v1/coverage');
    if (status !== 200) await Actor.fail(`Coverage request failed (HTTP ${status}).`);
    for (const s of body) {
        await Actor.pushData({
            operation: 'coverage',
            state: s.code,
            name: s.name,
            businessCheck: s.registry?.built === 'built',
            lienSearch: s.lien?.built === 'built',
            lenderSearch: s.lien?.built === 'built' && s.lien?.securedPartySearch === true,
        });
    }
    log.info(`Listed coverage for ${body.length} jurisdictions.`);
}

if (operation === 'verifyBusiness') {
    const list = Array.isArray(input.businesses) ? input.businesses : [];
    if (!list.length) await Actor.fail('Add at least one business under "Businesses to verify".');
    for (const b of list) {
        const name = String(b?.name ?? '').trim();
        const state = String(b?.state ?? '').trim().toUpperCase();
        if (!name || state.length !== 2) {
            await Actor.pushData({ operation, input: b, error: 'Each business needs a name and a two-letter state.' });
            continue;
        }
        const q = new URLSearchParams({ name, state });
        if (b.owner) q.set('owner', String(b.owner));
        if (b.minMonths !== undefined) q.set('min_months', String(b.minMonths));
        const { status, body } = await call(`/v1/business-check?${q}`, apiKey);
        if (status === 401) await Actor.fail('Clerkfield rejected the API key. Check it at https://clerkfield.com/app#profile.');
        if (status !== 200) {
            await Actor.pushData({ operation, input: { name, state }, error: body?.error ?? `HTTP ${status}` });
            continue;
        }
        await Actor.pushData({
            operation,
            input: { name, state, ...(b.owner ? { owner: b.owner } : {}) },
            verdict: body.verdict,
            summary: (body.flags ?? []).map((f) => f.message).join(' '),
            source: sourceOf(body),
            result: body,
        });
        log.info(`${name} (${state}): ${String(body.verdict).toUpperCase()}`);
    }
}

if (operation === 'searchLiens') {
    const state = String(input.lienState ?? '').trim().toUpperCase();
    const name = String(input.lienName ?? '').trim();
    if (state.length !== 2 || !name) await Actor.fail('Add the lien search state and a business or lender name.');
    const q = new URLSearchParams({ state });
    q.set(input.lienSearchBy === 'securedParty' ? 'secured_party' : 'debtor', name);
    q.set('include_inactive', input.includeInactive === false ? 'false' : 'true');
    const { status, body } = await call(`/v1/liens?${q}`, apiKey);
    if (status === 401) await Actor.fail('Clerkfield rejected the API key. Check it at https://clerkfield.com/app#profile.');
    if (status !== 200) {
        await Actor.pushData({ operation, input: { state, name }, error: body?.error ?? `HTTP ${status}` });
    } else {
        const s = body.summary ?? {};
        await Actor.pushData({
            operation,
            input: { state, [input.lienSearchBy === 'securedParty' ? 'securedParty' : 'debtor']: name },
            summary: `${s.total ?? 0} filings (${s.active ?? 0} active, ${s.lapsed ?? 0} lapsed, ${s.terminated ?? 0} terminated). Lenders on active filings: ${(s.activeSecuredParties ?? []).join(', ') || 'none'}.`,
            source: sourceOf(body),
            result: body,
        });
        log.info(`Lien search in ${state} for "${name}": ${s.total ?? 0} filings.`);
    }
}

await Actor.exit();
