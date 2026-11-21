# GMB and MetaAds Scraper — LocalScope Research Workbench

A local-first dashboard for organizing **business and advertising records you are authorized to use**. Despite the repository name, this Phase 1 release is a research workspace, not a scraper: it has no Maps/Meta crawler, anti-detection code, email discovery, or background collection.

## Run it locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite (normally `http://127.0.0.1:5173`). To create a static production build:

```bash
npm run build
npm run preview
```

No API keys are required. There is no application backend. Imported files are parsed in the browser and kept in that browser profile's IndexedDB database (with a localStorage fallback); they are not uploaded by this app. Browser-local data is not encrypted, so use a device/profile you control and clear the workspace when finished.

## What it does

- Import user-supplied CSV or JSON files as business records or ad records.
- Normalize common columns (business/advertiser, city, state, country, website, social links, phone/email, ratings/review counts, profile URLs, ad text, active status, library/page IDs and URLs).
- Search and filter imported records by business, location, category, contact/website presence, ad status, country, and city where the source supplied it.
- Keep source name, import date, license notes, storage permission, and export permission with each imported batch.
- Suggest possible business/ad pairings with a transparent name/domain/location score; a person must confirm each match.
- Export only rows explicitly marked exportable by the user at import. The workspace can export CSV; Google Sheets can import that CSV.
- Load fictional demo data to explore the interface, then clear it before real work.

## Data rights and platform boundaries

Import only files that you are authorized to store and use in this workspace. Export permission is a separate decision from permission to view or store data. The rights declarations are self-attestations and **do not verify a provider's license or make a prohibited source permissible**.

Google's standard Maps/Places policies prohibit exporting Maps-derived business listings into an external lead-list database. Do not import or export Google Maps/Places-derived listing content in this workspace unless you have separate written permission/custom licensing that covers the exact storage and use. Meta data must come from an authorized API or another expressly permitted source; this app does not scrape Meta pages. See [`docs/RESEARCH_AND_BUILD_PLAN.md`](docs/RESEARCH_AND_BUILD_PLAN.md) and [`docs/API_ACCESS_AND_DATA_RIGHTS.md`](docs/API_ACCESS_AND_DATA_RIGHTS.md).

The dashboard's location/profile/ad fields are only as reliable as the supplied file. A “profile present” field is source-reported, not a live Google Business Profile check. “Active ad” counts and duration are descriptive signals, not spend, reach, conversion, or campaign-performance estimates.

## API and provider setup guidance

The current MVP does not call external APIs. If you later want a live connector:

- **Meta Ad Library API:** first obtain the required Meta developer access and authorization. Its documented coverage is limited by country, ad category, dates, and available fields; it is not a worldwide city-level commercial-ad feed. Keep any future access token server-side rather than in browser code.
- **Google Places:** the standard API terms do not permit the requested external lead-list export. Do not purchase an API key for that purpose. For a Google in-app search/display experience, review the official policies and attribution requirements; broader export use needs written Google permission/custom licensing.
- **Business data for export:** choose a source whose written license permits the specific storage, matching, CSV export, and outreach research you intend. Review field-level rights, retention, attribution, and downstream sharing before connecting it.

See the API setup document for official links and a step-by-step checklist. No credentials are needed for this local prototype.

## Privacy and security

- No analytics, login, remote database, external fonts, or third-party data API calls are included.
- Do not put API keys in source files, browser storage, or commits. A later connector should use a server-side secret store.
- Use **Settings → Clear local workspace** to delete the browser's stored data.
- Imported values remain user-supplied; review them before contacting anyone. This tool does not send messages or decide whether outreach is lawful.
