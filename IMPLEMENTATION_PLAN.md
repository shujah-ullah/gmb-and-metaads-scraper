# LocalScope implementation plan

## Product scope

A client-only local research workspace for user-supplied business and ad records. It imports CSV/JSON, keeps source and field-rights metadata, supports fast filters, suggests deterministic business/ad matches for human review, and exports only records marked exportable by the user. It does not crawl Google Maps or Meta, does not call any external API, does not harvest contacts, and does not transmit imported data.

## Architecture

- **Vite + React:** static browser application, served on loopback for local use.
- **Browser IndexedDB:** workspace, import batches, manual match decisions and data notes, with a small localStorage fallback. No application backend or remote database is required.
- **`src/lib/data.js`:** CSV/JSON parsing, source-aware record normalization, match scoring, and export eligibility.
- **`src/lib/demoData.js`:** fictional records for first-run exploration.
- **`src/lib/storage.js`:** versioned persistence and reset.
- **`src/components/ImportModal.jsx`:** file import, rights attestation, preview and validation.
- **`src/App.jsx` + `src/styles.css`:** responsive overview, business, ad, match and source/settings views.

## Data and guardrails

- Each imported batch records source, source type, import time, license notes, storage permission and separate export permission.
- A self-attestation is visible as self-attested; the app does not claim to validate a license.
- Imports explicitly identified as Google Maps/Places content are blocked unless the user records separate written permission covering storage/export.
- Meta records require confirmation that the source was an authorized API or another expressly permitted source; export remains a separate choice.
- File size and row-count limits bound browser memory use. No unattended jobs, API keys, proxies, browser automation or remote collection.
- CSV is the only export format in this phase; Sheets can import the permitted CSV.

## Design direction

- **Visual style:** quiet editorial operations console: warm off-white canvas, ink typography, restrained forest-green accents, subtle borders and compact data tables.
- **Core principles:** data-first hierarchy, clear evidence/provenance, visible permission states, low-noise interactions.
- **Layout:** fixed narrow navigation rail on desktop, flexible content area, stacked navigation on mobile; tables switch to compact cards below tablet width.
- **Signature elements:** small source badges, confidence meter with an explicit “suggestion” label, and a persistent local-only status indicator.
- **Interaction:** imports are deliberate and previewed; matches require a human confirmation; restricted export is disabled with an explanation.

## Structure

```text
src/
  App.jsx
  main.jsx
  styles.css
  components/ImportModal.jsx
  lib/data.js
  lib/demoData.js
  lib/storage.js
  lib/data.test.js
public/
  favicon.svg
  manus-routes.json
```

## Later integrations

Meta Ad Library and licensed business-data adapters are deferred until the user has credentials/approval and the exact retention/export rights are confirmed. Google Places is not an exportable lead source under standard published terms; any future use must be an eligible in-app experience or have separate written licensing. Keep API secrets server-side if a backend is added later.
