# API access and data-rights checklist

The current dashboard works without credentials. It reads user-supplied files in the browser and does not call Google, Meta, or a data provider. Do **not** request or paste API keys just to run the MVP.

## Before selecting a source

For every source, get written answers to these questions before building a live connector:

1. Which exact fields can we retrieve, and for which countries, dates, and record types?
2. May we store each field locally or on a server? For how long?
3. May we derive matching scores and aggregates from it?
4. May we display it to users, export it to CSV/Sheets, and use it for outreach research?
5. What attribution, deletion, opt-out, and rate-limit requirements apply?
6. What is the price per request/record and how are retries/bulk queries billed?

Keep a source/field permission record. A technically accessible field, a low-cost reseller, or public visibility is not itself a license to export or reuse it.

## Google Maps / Places

The standard Google Maps Platform and Places policies prohibit exporting/extracting Maps content for use outside the Services, with explicit examples involving bulk Places data and saved business names/addresses. The requested Maps-derived CSV lead list is therefore not enabled by this app.

If your goal is an eligible in-app Google experience, review:

- [Places API policies and attributions](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Maps Platform Terms](https://cloud.google.com/maps-platform/terms)
- [Places API usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Places API pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

A Google Cloud API key requires a billing-enabled project, the relevant API enabled, key restrictions, quotas and billing alerts. That does **not** grant an export license. For export-oriented use, get written permission/custom licensing from Google and legal review before implementation. Never place a key in React/browser source; a future connector would need a server-side secret and strict field/usage controls.

## Meta Ad Library API

The API is an authorized but limited transparency source. The official pages describe worldwide access for political/social-issue ads over a historical window and broader ad-type coverage for specified European markets; ordinary commercial ad availability outside that coverage is not promised. A general city-level query and commercial spend/impression reporting are not documented.

Start with:

- [Meta Ad Library API access](https://www.facebook.com/ads/library/api/)
- [Ads Archive Graph API reference](https://developers.facebook.com/docs/graph-api/reference/ads_archive/)
- [Archived Ad fields](https://developers.facebook.com/docs/marketing-api/reference/archived-ad/)
- [Meta automated data collection rules](https://developers.facebook.com/documentation/development/terms-and-policies/automated-data-collection)
- [Meta Platform Terms](https://developers.facebook.com/terms/dfc_platform_terms/)

Typical access preparation: create/verify the Meta developer account and app; complete any required identity/location confirmation; review current API version, app permissions and Platform Policy; request only the documented scope you qualify for; confirm allowed retention, display, matching, and export use. The exact access workflow and terms can change. No Meta credentials are needed for this local import-based MVP.

If authorized later, keep tokens on a server, request only the minimum permitted fields, label geographic/category/date coverage, preserve metric ranges rather than converting them into point estimates, and stop on authorization/rate-limit errors. Do not automate the website UI or attempt to bypass restrictions.

## Exportable business datasets

For business lists intended for CSV or outreach research, choose a provider whose contract expressly allows the required storage, derived matching, user access, and export. Ask about source lineage, field coverage, refresh cadence, accuracy, deletion/retention, redistribution, geographic terms, and any downstream use restrictions.

OpenStreetMap-derived sources may be available under ODbL, which has attribution and share-alike obligations; production use should rely on an appropriately licensed provider or self-hosting rather than overloading public infrastructure. Commercial POI vendors such as Foursquare may be candidates, but confirm the exact current Places contract, permitted retention/export, and pricing before use. Do not assume that a vendor's ability to extract Google Maps results supplies Google authorization.

## Google Sheets

The MVP exports CSV locally. You can import that file into Google Sheets after confirming the source rights. A direct Sheets connector would require a separate Google OAuth integration and its own credential, scope, privacy, and deployment decisions; it is not required to use the app.

## Contact details and outreach

This is a research workspace, not an email-harvesting or sending tool. It does not find, guess, or enrich email addresses. Only import contact data from sources you are authorized to process, and independently evaluate privacy, suppression, and marketing rules before outreach. In the United States, FTC CAN-SPAM guidance applies to commercial email including B2B; UK/EU and state privacy rules can impose additional requirements.

## Source references

The detailed 21 November 2026 policy research and implementation plan is in [`RESEARCH_AND_BUILD_PLAN.md`](RESEARCH_AND_BUILD_PLAN.md). Pricing, policies, API versions, and access rules change; re-check the official source pages immediately before procurement or integration. This checklist is informational, not legal advice.
