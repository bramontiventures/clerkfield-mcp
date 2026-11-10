---
name: check-ucc-liens
description: Find UCC liens (financing statements) filed against a business or filed by a lender, and summarize existing debt and stacking. Use when the user asks about UCC filings, liens, secured parties, existing lenders or funders, stacking, merchant cash advance positions, or wants to see every lien a lender has filed in a state.
---

# Check UCC liens with Clerkfield

Use the Clerkfield connector's `search_liens` tool. Results come from the state's UCC filing office with the source and data date.

## Steps

1. **Decide the search.**
   - Against a business (debtor): use `debtor` with the business name. This is the stacking check.
   - By a lender (secured party): use `secured_party` with the lender's name, to see every filing that lender has made.
   - You need the two-letter state. UCC filings are usually made in the state where the business is organized. If unsure whether a state is covered (or supports search by lender), call `get_coverage` first and say plainly if it isn't.
2. **Search all statuses first** (leave `active_only` off), so lapsed and terminated filings give history. Use `active_only: true` only when the user asks for current liens alone.
3. **Lead with the summary**: how many filings, how many active, lapsed and terminated, and the lenders (secured parties) on active filings. These active lenders are the stacking picture.
4. **List the active filings** in a short table: secured party, file number, filing date, lapse date, and collateral in a few words. Mention notable later amendments (continuation, assignment, termination).
5. **Point out what matters for underwriting**, carefully and factually:
   - Several active filings from different funders close together in time can indicate stacked positions.
   - Collateral describing "accounts", "receivables" or "future receipts" is common for merchant cash advances; equipment or vehicle collateral usually isn't.
   - A filing can stay active after the debt is paid if nobody filed a termination; say so instead of assuming the debt is outstanding.
6. **Cite the source and data date**, and note any fields the state doesn't publish.

## Rules

- Match names carefully: different businesses can have similar names. If filings may belong to more than one debtor, say so and show the addresses.
- If more than 50 filings come back, say that only the newest 50 are shown.
- Never state a lien amount; UCC filings don't include one.
- If the state's records can't be reached, say so and suggest trying again later.
