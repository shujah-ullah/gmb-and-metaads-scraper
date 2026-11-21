# Maps + Meta Ads Business-Research Tool: Decision and Compliant Build Plan

**Research checked: 21 November 2026**

## Product decision

A local-first, GitHub-hosted research application is feasible, but the proposed combination of Google Maps-derived prospect exports and unrestricted Meta commercial-ad intelligence is not. Google Places can technically return business names, addresses, ratings, review counts, websites, and phone numbers. Google’s published Places policy nevertheless prohibits exporting, extracting, or scraping Maps Content for use outside Google’s services, and specifically prohibits copying and saving business names and addresses. A CSV/Sheets lead-list export of Places-derived listings therefore is not permitted by the standard published terms, even when obtained through the paid API. Place IDs have a caching exception, but that does not authorize retaining the other listing fields. [1][2][3]

Meta’s Ad Library API is an official research path, but it is geographically and categorically limited. It is not a dependable worldwide feed of ordinary commercial ads, provides no documented city-level search filter, and does not provide ordinary commercial-ad spend/impression metrics in the cited field contract. Meta’s rules prohibit automated collection outside the authorized API scope unless Meta separately grants permission. [4][5][6][7]

**Recommendation:** build a local dashboard and research workflow now around user-supplied files and data sources whose licenses explicitly permit the intended storage and export. Keep Google Places as a later, in-app display/search integration only if the user’s product experience and storage/display behavior fit Google’s terms; do not offer Maps-derived CSV lead exports without written permission/custom licensing. Add Meta Ad Library API only after the user obtains the required account/app access and confirms the intended use is within its documented scope and current terms. Treat broader Meta collection as blocked absent written authorization. This is a product/policy assessment, not legal advice or a compliance guarantee.

## What can and cannot be searched

### Google Places

Places Text Search (New) accepts text queries and can refine by location, type, rating, open status, and other options. It supports field masks, returns matching Place objects, and returns at most 60 results across pages; Google warns that identical requests are not guaranteed to return consistent results. Place Details can retrieve additional details by Place ID. [8][9]

The requested business fields are technically available: `displayName`, `formattedAddress`, `rating`, `userRatingCount`, `websiteUri`, `nationalPhoneNumber`, and `internationalPhoneNumber`. Field masks are mandatory. Search/Details billing is determined by the highest applicable SKU requested, not by adding a fee for each field. Name/address-only Text Search is in the Pro tier; requesting rating, review count, phone, or website fields can put the request in the Enterprise tier. [9][10][11]

That technical capability does not authorize an exportable lead database. Google’s policy prohibits exporting or extracting Maps Content outside the Services, and expressly gives copying and saving business names and addresses as prohibited examples. The narrow Place ID and coordinate exceptions do not create a general listing-field retention allowance. Do not implement CSV/Sheets export, durable listing storage, or lead-generation reuse of Google Maps-derived names, addresses, ratings, review counts, websites, or phone numbers under standard published terms. If Google is used, design for an eligible in-app search/display experience, required map/logo and other attribution, no prohibited export or persistence, and public Terms of Use and Privacy Policy. Seek written Google confirmation/custom licensing and legal review before any broader use. [1][2][3]

Global list prices checked on the research date are USD per 1,000 billable events, with monthly free usage caps and volume tiers: Text Search Pro has 5,000 free events/month and starts at $32 per 1,000 in the first paid tier; Text Search Enterprise has 1,000 free and starts at $35 per 1,000. Place Details Pro has 5,000 free and starts at $17 per 1,000; Details Enterprise has 1,000 free and starts at $20 per 1,000. Rates decline at higher monthly volume tiers. India has a separate price list; billing region and applicable legal terms matter. These are cost estimates, not usage rights. [11][12][13]

Google’s public documentation describes method-specific, per-project quotas and directs users to Cloud Console to view/manage them; the reviewed public page did not establish a universal numeric default QPM. Do not assume unlimited quota or treat the 60-result cap as permission to enumerate businesses. [14]

### Meta Ad Library

Meta’s API access process requires a Facebook account, identity/location confirmation for social-issue/election/political-ad access, a Meta for Developers account and app, and agreement to Platform Policy. Identity/location confirmation can take several days. Meta describes API coverage as social-issue/election/political ads delivered worldwide during the prior seven years and ads of any type delivered to the UK or EU during the prior year. The API’s `ad_type=ALL` does not mean all ordinary commercial ads worldwide; it covers all topics within eligible geographic inventory. [4][5]

Documented filters include country, ad type, active status, delivery-date bounds, language, media type, publisher platforms, search terms (maximum 100 characters), exact phrase versus unordered keyword search, and up to 10 Page IDs. Searches can match text, images, video audio, and calls to action, and are not automatically translated. `delivery_by_region` is documented for political/issue ads, not general commercial ads. The docs do not establish city-level search or arbitrary city filtering. UK/EU `target_locations` on eligible records is not a general city-query feature. [5][6]

Archived-ad records include creative and page/delivery metadata such as Library ID, dates, body/link text, snapshot URL, Page ID/name, platforms, and language. Spend and impression figures are ranges restricted to political/issue ads; estimated audience size is a different, political-only measure, not delivered reach. Demographic and regional distribution data are limited by category and geography and are estimates/aggregates. Do not promise exact spend, reach, targeting precision, or ordinary commercial-ad benchmarking from this API. [6]

A material change took effect 6 October 2025: Meta said political/electoral/social-issue ads could no longer be delivered in the EU, and release notes say the political/issue `ad_type` combined with an EU country query became unavailable. Do not assume older archive descriptions mean those EU political queries remain available. Recheck the current versioned documentation and account behavior before launch. [7][15]

Meta Platform Terms restrict selling/licensing Platform Data and unsupported processing. Paid access, exports, bulk retention, and creative reuse need review against the current terms and the exact authorized API use. The research did not verify a numeric Ad Library API quota or completeness guarantee. [16]

### Automated collection, scraping libraries, and evasion

Playwright and Beautiful Soup are technical tools: Playwright automates browsers, while Beautiful Soup parses HTML/XML supplied to it. Their capabilities do not authorize collection. Meta says automated access/collection requires prior permission; its developer guidance says Platform APIs are the only allowable programmatic access route absent prior written permission and disallows scripts, HTTP libraries, JavaScript, or other executable code making Meta data requests outside Platform APIs. Logged-in access, public visibility, low request volume, and accepting Meta’s Automated Data Collection Terms do not themselves grant the required separate permission. [17][18][19][20]

**Anti-detection evasion or bypass cannot be built or advised.** No CAPTCHA solving, proxy rotation, fingerprint masking, account rotation, rate-limit evasion, or access-control circumvention will be included. Do not use Playwright/Beautiful Soup or similar tooling to collect Meta product data outside an expressly authorized API or separate written permission. Stop collection rather than attempting to defeat a block.

## Data sources and exports

The source determines whether a field may be retained or exported. Maintain a source/field-level license ledger and enforce it in the application; never infer export permission from an API response, vendor price, public visibility, or file format.

- **User-supplied files:** safest initial route for the local prototype. Import CSV/JSON provided by the user, preserve the supplied provenance and license notes, and make export available only where the user confirms rights for the data and intended use. Do not silently enrich it from restricted sources.
- **OpenStreetMap:** a potential source under ODbL, with attribution and, where applicable, share-alike obligations. Coverage and contact fields are not guaranteed, and production use should use an appropriately licensed hosted provider or self-hosting rather than relying on public OSM infrastructure. [21]
- **Foursquare Places:** a commercial licensed POI API worth evaluating, but do not assume storage, retention, redistribution, or export rights without confirming the applicable Places contract. Its public pricing pages conflict on the Pro free-call amount (500 versus “up to 10,000”); confirm pricing and license directly before budgeting or implementation. [22][23]
- **Outscraper:** its product page markets low-cost Google Maps extraction and multiple export formats, but the vendor’s capability/pricing does not grant Google rights. Do not use it as the foundation for a persistent Google Maps-derived lead database absent independently verified authorization and counsel review. The public pages reviewed did not establish a general task-output retention schedule or universal concurrency limit. [24][25][26]
- **Meta Ad Library API:** use only for authorized, documented coverage and fields. It is not a permission to scrape Meta pages or expand collection beyond API scope. [4][5][16][18]

CSV export should be enabled only when the underlying source license and applicable terms allow export and the user’s intended downstream use. Attach attribution and provenance where required. If any field is non-exportable, omit it from export rather than relying on a disclaimer. For a source whose terms permit in-app display but not durable storage or export, keep the feature in the permitted experience and do not persist or export the restricted content.

## Recommended low-cost local architecture

Use a local-first application with a small, auditable stack: a browser UI, local SQLite database for permitted user/source data, and a thin server/API layer for connectors that require secrets. Keep API credentials in environment variables or an OS key store; never commit credentials to GitHub or send them to the browser. Make the default deployment private/local. Add hosted deployment only after privacy, terms, authentication, and secret-management choices are deliberate.

Create a canonical record model with explicit source, source record ID, retrieval/import timestamp, source publication/update date if available, field-level provenance, license/retention class, and a status for user verification. Suggested record attributes: business name, location/address, category, website, phone, source-native ad/page IDs and URLs, and research notes. Each field should carry its own provenance and freshness timestamp; do not collapse a field from one source into a supposedly verified unified fact. Retention must be source-specific: enforce the source’s stated TTL/deletion rules, never infer a broad cache period from a narrow exception, and retain only IDs where the source permits that exception. For Google Places, Place IDs may be retained subject to the published rules, but other listing content must not be retained/exported outside the permitted service experience. [1][2][3]

Keep business discovery and ad research as separate modules. Link them only through **confidence-scored manual matching**: let the user choose a business and an ad/page record, show the evidence (name, geography, page identity, website if licensed), and record the user’s match decision and confidence. Do not imply an authoritative business-to-ad join where the API does not provide one. A low/uncertain match should remain unlinked pending review.

For Meta, provide coverage badges at query and result level (country, ad category, archive window, and whether metrics are estimates/ranges). Use political/issue spend/impression buckets as ranges with currency, and do not show spend/reach benchmarking for ordinary commercial ads. For Google, if an eligible in-app feature is approved, display required Google attribution and keep its fields out of downloadable exports. [1][4][5][6]

### Safety, quotas, and operational controls

- Enforce hard user-configured request, result, time, and spend ceilings before every connector call; include a visible monthly budget and per-source meter. Align limits with the actual Cloud Console quota and approved API scope. Fail closed when quota or license metadata is missing.
- No unattended or background collection. Collection runs only on explicit user action, with a visible progress state and a user-controlled cancel operation. Do not crawl or enumerate geographical grids or categories to approximate a bulk directory.
- Cancel and stop the connector on **401, 403, 429, CAPTCHA, or robots/access blocks**. Do not retry in a way that evades the signal; do not switch accounts, proxies, fingerprints, or identities. For authorized APIs, use only documented retry behavior and honor the API’s applicable limits.
- Do not harvest emails from unauthorized sources, infer/guess addresses, or build dictionary-generation features. Do not enrich user data from Meta pages or restricted Maps content.
- Keep CSV export disabled by default per source until its license class explicitly permits it. Log export events, show provenance and applicable attribution, and exclude fields that are not exportable.
- Separate contact research from sending campaigns. Do not implement email sending in the initial build. Any later outreach integration needs separate legal/provider review and suppression controls; public availability is not proof of permission to contact.

## Outreach safeguards if the product later adds contact workflows

FTC guidance says CAN-SPAM applies to commercial messages, including B2B, and does not generally require prior opt-in; it still requires accurate sender/routing information, non-deceptive subjects, ad identification, a valid physical postal address, a working opt-out, and honoring opt-outs within 10 business days. The opt-out method must remain available for at least 30 days, and responsibility can apply to both the promoted and sending companies. Purchased lists are not proof that addresses are usable or unsuppressed. [27][28]

Business contact information can still be personal information. California’s CPPA states that business contacts and employees are included in its discussion of California residents and that the B2B/employment exemptions expired on 31 December 2022; actual CCPA coverage depends on statutory criteria. UK rules distinguish corporate subscribers from sole traders/some partnerships for PECR email, while UK GDPR applies to named business contacts and publicly available details. EU GDPR gives people an unconditional right to object to personal-data processing for direct marketing; after objection, stop that processing. UK guidance is under review following the Data (Use and Access) Act, so recheck before UK launch. [29][30][31]

If later enabled, build geography/recipient-type gating, clear data-source and purpose disclosures, minimal field collection, secure access and retention limits, opt-out/objection suppression, export logs, and a tested unsubscribe flow. Keep the minimum suppression signal needed to prevent re-contact while separating it from ordinary records. These are prudent design controls, not a determination that any particular dataset or campaign is lawful.

## Phased build plan

**Phase 1 — Local research workspace:** implement project setup, user-supplied CSV/JSON import, source/field provenance, filters on permitted fields, manual notes, confidence-scored business/ad matching, and export only for records explicitly marked exportable. Include a source/license registry and import preview. Do not add scraping, Meta login automation, email sending, or Google Maps listing export.

**Phase 2 — Licensed place data:** evaluate OSM-derived or Foursquare data. Obtain and document the exact license/contract, permitted fields, caching/retention, display, attribution, derived analytics, and downstream export rights. Build a source adapter only after those questions are resolved. Confirm pricing and limits with Foursquare because public free-tier statements conflict. [21][22][23]

**Phase 3 — Official Meta integration:** user obtains Meta developer account/app access and required identity/location confirmation and permissions. Verify the current API version, coverage, fields, terms, quotas, and intended commercial use before enabling. Begin with user-triggered queries in documented country/date/ad-category scope, clear coverage labels, and no unsupported bulk creative download. [4][5][6][16]

**Phase 4 — Optional Google in-app experience:** only if the user chooses a Google-supported application experience and confirms terms with counsel/Google. Obtain a billing-enabled project/API key, use minimal field masks, configure quotas and billing alerts, render required Google attribution, and prohibit listing-field export/persistence. A custom Google license would be a separate prerequisite for any broader lead-list use. [1][2][11][14]

## Decision and prerequisites

**Build now:** the local app shell, user-supplied-file workflows, provenance and license controls, filtering over permitted imported fields, manual business/ad matching with confidence scores, and compliant export for data whose source license permits it.

**Requires user credentials/approval:** Meta Ad Library API integration requires the user’s Meta account/developer app and applicable identity/location confirmation and authorization. Google API access requires the user’s Google Cloud project, billing and key, but these credentials alone do not permit the proposed lead-list export. A compliant Google in-app module requires product design conforming to Google’s display/storage rules; export-oriented Maps data requires written Google permission/custom licensing. Foursquare requires a user account/contract and confirmation of license, price and retention terms. OSM production use requires an appropriate provider or self-hosting plan and ODbL compliance. [1][2][4][14][21][22]

**Do not build:** Google Maps-derived downloadable business lead lists under standard terms; a worldwide ordinary-commercial Meta ad feed; city-level Meta ad search not supported by the documented API; unauthorized Meta page scraping; email harvesting from unauthorized sources; or any anti-detection/evasion or access-control bypass. Where official APIs do not support the target use, use licensed data or user-supplied files with verified rights, or leave the feature out.

## Sources

[1]: https://developers.google.com/maps/documentation/places/web-service/policies "Policies and attributions for Places API"
[2]: https://cloud.google.com/maps-platform/terms "Google Maps Platform Terms of Service"
[3]: https://developers.google.com/maps/documentation/places/web-service/place-id "Place IDs | Places API (New)"
[4]: https://www.facebook.com/ads/library/api/ "Ad Library API"
[5]: https://developers.facebook.com/docs/graph-api/reference/ads_archive/ "Ad Library API — Graph API Reference (v27.0)"
[6]: https://developers.facebook.com/docs/marketing-api/reference/archived-ad/ "Archived Ad — Graph API Reference (v27.0)"
[7]: https://www.facebook.com/ads/library/api/releasenotes "Release notes"
[8]: https://developers.google.com/maps/documentation/places/web-service/text-search "Text Search (New) | Places API"
[9]: https://developers.google.com/maps/documentation/places/web-service/place-details "Place Details (New) | Places API"
[10]: https://developers.google.com/maps/documentation/places/web-service/data-fields "Place Data Fields (New) | Places API"
[11]: https://developers.google.com/maps/billing-and-pricing/sku-details/places "SKU details | Places API"
[12]: https://developers.google.com/maps/billing-and-pricing/pricing "Google Maps Platform core services pricing list"
[13]: https://developers.google.com/maps/billing-and-pricing/pricing-india "Google Maps Platform core services pricing list - India"
[14]: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing "Places API Usage and Billing"
[15]: https://about.fb.com/news/2025/07/ending-political-electoral-and-social-issue-advertising-in-the-eu/ "Ending Political, Electoral and Social Issue Advertising in the EU in Response to Incoming European Regulation"
[16]: https://developers.facebook.com/terms/dfc_platform_terms/ "Meta Platform Terms"
[17]: https://m.facebook.com/terms/ "Meta Terms of Service"
[18]: https://developers.facebook.com/documentation/development/terms-and-policies/automated-data-collection "Automated Data Collection"
[19]: https://www.facebook.com/legal/automated_data_collection_terms "Automated Data Collection Terms"
[20]: https://playwright.dev/python/docs/intro "Installation | Playwright Python"
[21]: https://www.openstreetmap.org/copyright "Copyright and License"
[22]: https://foursquare.com/pricing/ "Foursquare Pricing"
[23]: https://foursquare.com/products/places-api/ "Places API | Global POI Data for Developers"
[24]: https://outscraper.com/google-maps-scraper/ "Google Maps Scraper"
[25]: https://outscraper.com/terms-of-service/ "Terms of Service"
[26]: https://docs.outscraper.com/endpoints/google-maps-search/ "/google-maps-search — Outscraper API Docs"
[27]: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business "CAN-SPAM Act: A Compliance Guide for Business"
[28]: https://www.ftc.gov/business-guidance/blog/2015/08/candid-answers-can-spam-questions "Candid answers to CAN-SPAM questions"
[29]: https://cppa.ca.gov/faq.html "Frequently Asked Questions (FAQs) - California Privacy Protection Agency"
[30]: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/ "Business-to-business marketing"
[31]: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/dealing-requests-individuals_en "Dealing with requests from individuals"
