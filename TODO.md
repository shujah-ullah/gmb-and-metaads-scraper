# LocalScope implementation status

## Completed outcomes

- [x] **Local research dashboard:** Build a responsive React/Vite workspace with Overview, Businesses, Ad records, Match review, and Sources & access views; keep the visual design compact, data-first, and mobile-responsive.
- [x] **Authorized file import and provenance:** Import user-supplied CSV or JSON in the browser; enforce the 15 MB and 10,000-record limits; normalize common business/ad fields; preview imports and skipped rows; record the source, import date, license note, and separate storage/export attestations for each batch.
- [x] **Business and ad organization:** Display supplied business name, category, address/location, website, social links, phone/email, rating/review count, and profile fields; filter business rows by country/state/city, website, email, and export-right status. Display supplied advertiser, ad text, status, country/city, start date, IDs, source URL, and platform; filter ads by country, supplied city, and status; summarize supplied active records, advertiser names, and creative variants without claiming spend or campaign performance.
- [x] **Business/ad review and manual matching:** Suggest candidate pairs using only supplied name, domain, and location evidence; show reasons and a confidence score; allow manual selection even below the automated suggestion threshold; require a human confirmation for a confirmed link; allow dismissal/removal.
- [x] **Rights-gated CSV output:** Export filtered business/ad CSV only for records marked export-permitted; export confirmed matches only when both underlying records are export-permitted. Exclude restricted/unknown records and state what was excluded. Google Sheets use is via importing the permitted CSV, not a live connector.
- [x] **Local-only persistence and privacy controls:** Keep imports in browser IndexedDB with a localStorage fallback; do not upload records, call external APIs, scrape Maps/Meta, harvest contact data, or bypass anti-bot/access controls. Include fictional demo data, a clear-workspace action, a functioning Cmd/Ctrl+K search shortcut, and written API/data-rights guidance.
- [x] **Research and implementation guidance:** Retain the sourced policy research, provider/access guidance, phased plan, local run instructions, and the explicit Google Maps/Places and Meta Ad Library limits in the project documentation.

## Remaining handoff outcome

- [ ] **Public GitHub repository and local-run handoff:** Initialize Git in this separate LocalScope folder, create and push to the public repository `shujah-ullah/gmb-and-metaads-scraper` (normalized from “GMB and MetaAds Scraper” because GitHub repository URLs do not contain spaces), and provide its URL and `npm install` / `npm run dev` localhost instructions. Do not put credentials or API keys in the repository. This repository is separate from the Solar Financing WebDev project.
