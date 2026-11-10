---
name: verify-business
description: Verify that a U.S. business is real, registered and active using official state records. Use when the user asks to verify, check or KYB a business or merchant, confirm a company exists or is in good standing, check how long it has been in business, or confirm an applicant is an owner or officer.
---

# Verify a business with Clerkfield

Use the Clerkfield connector's tools. Every result comes from the state's own records and carries its source and data date; never fill gaps from memory.

## Steps

1. **Get the inputs.** You need the business name and the two-letter state where it was formed (not necessarily where it operates). If the user gave an applicant or owner name, keep it for `owner`. If they gave a minimum time in business (for example "at least a year"), convert it to months for `min_months`; otherwise leave it out (the default is 6).
2. **Check coverage if unsure.** If you don't know whether the state is covered, call `get_coverage` with that state. If business checks aren't covered there, say so plainly and stop; don't guess.
3. **Run the check.** Call `verify_business` with `name`, `state`, and `owner` / `min_months` when you have them.
4. **Report the verdict first**, in one line: PASS, REVIEW or FAIL, and the legal name and entity ID matched.
5. **Explain each flag** in plain words: an exact or only close name match, active or inactive status, months in business against the minimum, and whether the applicant appears among the officers the state lists. A REVIEW usually means a person should confirm something (for example the registry name is close but not identical).
6. **Show the key record fields** as a short table: legal name, entity ID, type, status, formation date, principal address, registered agent, officers. Mark any field the state doesn't publish as "not published", never blank.
7. **Cite the source and date** given in the result.

## Rules

- If the state's records can't be reached, say so and suggest trying again; don't present an older or guessed answer.
- If several businesses match, list them and ask which one the user means instead of picking one.
- The owner check only shows whether a name appears among the officers a state lists. Don't describe it as identity verification.
- Clerkfield reports on businesses only and is not a consumer reporting agency. Don't use results to decide an individual's eligibility for personal credit, employment, housing or insurance; if the user asks for that, explain the limit.
