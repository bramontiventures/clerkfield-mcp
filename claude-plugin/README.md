# Clerkfield for Claude

Verify U.S. businesses against official state registries and check their UCC liens for stacking, right from a conversation with Claude. Built for merchant cash advance funders, lenders, brokers and fintech teams doing KYB (know your business).

## What's included

- **Clerkfield connector** (remote MCP server at `https://clerkfield.com/mcp`) with three read-only tools: `verify_business`, `search_liens` and `get_coverage`.
- **verify-business** skill: runs a business check and explains the Pass, Review or Fail verdict, the record fields and the source.
- **check-ucc-liens** skill: searches UCC filings by business or by lender and summarizes active lenders, lapses and stacking signals.
- **/clerkfield:underwrite** command: a one-page credit-file summary that combines both checks.

## Set up

1. Create a free Clerkfield account at [clerkfield.com/app](https://clerkfield.com/app#signup). No card is needed during the beta.
2. Install the plugin, open its **Connectors** tab and connect Clerkfield. A clerkfield.com page opens: sign in with your Clerkfield email and password and choose **Allow**. Claude Code connects to the same server and asks you to sign in the first time.

## Use it

Ask things like "Verify DIY Automotive LLC in Florida and check whether Eric Vonfricken is an officer", "Which lenders have active UCC liens on DIY Automotive LLC in Florida?", or run `/clerkfield:underwrite DIY Automotive LLC, FL`. Ask "Which states does Clerkfield cover?" to see coverage; business checks and lien search cover different sets of states.

## Data

The plugin sends only what each tool needs (business names, states, lender names and, if you give one, the applicant's name) to Clerkfield at clerkfield.com over HTTPS, under your Clerkfield account, where each check counts as your company's usage. Clerkfield answers from official state records and returns the source and date. The plugin itself runs no scripts and stores nothing. Clerkfield's handling of this data is described in its [privacy policy](https://clerkfield.com/privacy) and [terms](https://clerkfield.com/terms).

Clerkfield reports on businesses only and is not a consumer reporting agency: don't use results to decide an individual's eligibility for personal credit, employment, housing or insurance.

## Support

hello@clerkfield.com · [Documentation](https://clerkfield.com/docs#mcp)

Made by Bramonti Ventures LLC. MIT licensed.
