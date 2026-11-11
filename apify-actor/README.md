# Clerkfield: U.S. Business Verification & UCC Lien Search

Verify U.S. businesses against **official state registries** and search **UCC liens** by business or by lender, with the source and data date on every result. This Actor is a thin client of the [Clerkfield](https://clerkfield.com) API: it doesn't scrape anything itself. Clerkfield reads each state's own business registry and UCC filing office and returns structured, verified results.

Built for merchant cash advance funders, lenders, brokers and fintech teams doing KYB (know your business).

## What it does

- **Verify businesses**: for each business (name + two-letter state of formation, optionally the applicant's name), get a **Pass, Review or Fail** verdict with the reasons: exact or close name match, active or inactive status, months in business against your minimum, and whether the applicant appears among the officers the state lists. The full state record comes back too: legal name, entity ID, status, formation date, addresses, registered agent and officers.
- **Search UCC liens**: list the UCC financing statements filed against a business, or every filing a lender has made in a state. You get totals (active, lapsed, terminated), the lenders on active filings (useful to spot stacking), and each filing's file number, dates, parties, collateral and later amendments.
- **Get coverage**: which states each check covers. No API key needed.

Coverage differs by check and state; see [clerkfield.com/coverage](https://clerkfield.com/coverage). An uncovered state returns a clear "not covered" error instead of guessed data.

## How to use it

1. Create a free Clerkfield account at [clerkfield.com/app](https://clerkfield.com/app#signup) and create an API key in your profile (it starts with `cf_live_`).
2. Paste the key into **Clerkfield API key** (stored as a secret input).
3. Choose **What to do**:
   - *Verify businesses*: fill **Businesses to verify**, for example `[{"name": "DIY Automotive LLC", "state": "FL", "owner": "Eric Vonfricken"}]`. Add as many as you need.
   - *Search UCC liens*: set the state, search by business or lender, and the name.
   - *Get coverage by state*: no other input needed.
4. Run it. Each result is a row in the dataset (the **Overview** view shows the verdict or summary and the source), with the full API response in `result`.

## Output example (verify)

```json
{
  "operation": "verifyBusiness",
  "input": { "name": "DIY Automotive LLC", "state": "FL", "owner": "Eric Vonfricken" },
  "verdict": "pass",
  "summary": "Eric Vonfricken is listed as Manager.",
  "source": "Florida Division of Corporations, Sunbiz bulk data · data as of 2026-11-10 · https://search.sunbiz.org/Inquiry/CorporationSearch/ByDocumentNumber?searchTerm=L22000110053",
  "result": { "verdict": "pass", "matchQuality": "exact", "match": { "legalName": "DIY AUTOMOTIVE LLC", "status": "active", "formedOn": "2022-03-03", "...": "..." } }
}
```

`summary` joins the reasons behind the verdict; when everything checks out, only the owner confirmation (if you gave an owner) appears.

## Pricing

The Actor is free to run (you pay only Apify's normal platform usage). Clerkfield itself is free during its beta, and each check counts as usage on your Clerkfield account.

## Data and limits

The Actor sends the names and states you enter, and your API key, to `https://clerkfield.com` over HTTPS; nothing else. Clerkfield's handling of that data is in its [privacy policy](https://clerkfield.com/privacy) and [terms](https://clerkfield.com/terms). Clerkfield reports on businesses only and is not a consumer reporting agency: don't use results to decide an individual's eligibility for personal credit, employment, housing or insurance.

## Support

hello@clerkfield.com · [API documentation](https://clerkfield.com/docs) · [OpenAPI spec](https://clerkfield.com/openapi.json)

Made by Bramonti Ventures LLC.
