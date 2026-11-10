---
description: Build a one-page business check and UCC lien summary for a merchant's credit file
argument-hint: "<business name>, <state>[, applicant name]"
---

Build a credit-file summary for the business in: $ARGUMENTS

1. Parse the business name, the two-letter state of formation and, if given, the applicant's name. Ask for anything missing.
2. Run the business check as the `verify-business` skill describes (`verify_business`, with the applicant as `owner`).
3. Run the lien check against the same business as the `check-ucc-liens` skill describes (`search_liens` with `debtor`).
4. Write the summary in this order:
   - **Verdict:** PASS / REVIEW / FAIL and one sentence on why.
   - **Business record:** legal name, entity ID, status, formation date and months in business, registered agent, officers, and whether the applicant is listed.
   - **UCC liens:** total, active, lapsed and terminated; lenders on active filings with their filing dates.
   - **Points to review:** only what the records show (close name match, inactive status, recent formation, several recent active funders, applicant not listed). No speculation.
   - **Sources:** each source and data date from the results.
5. Keep it to one page. Don't recommend approving or declining; that decision belongs to the underwriter.
