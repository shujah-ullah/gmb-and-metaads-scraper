export const MAX_IMPORT_BYTES = 15 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 10000;

const BUSINESS_ALIASES = {
  name: ['business name', 'business', 'company name', 'company', 'organization', 'organisation', 'brand', 'name'],
  category: ['business category', 'category', 'industry', 'trade', 'type', 'vertical'],
  address: ['street address', 'formatted address', 'address', 'location'],
  city: ['city', 'town', 'locality'],
  state: ['state', 'province', 'region', 'state code'],
  country: ['country', 'country code', 'country name'],
  website: ['website', 'website url', 'url', 'domain', 'site'],
  phone: ['phone', 'phone number', 'telephone', 'national phone number'],
  email: ['email', 'email address', 'contact email'],
  rating: ['rating', 'star rating', 'google rating', 'stars'],
  reviewCount: ['review count', 'reviews count', 'number of reviews', 'user rating count', 'reviews'],
  profileUrl: ['google business profile', 'google profile url', 'gbp url', 'gmb url', 'profile url', 'listing url', 'maps url'],
  profilePresence: ['google profile present', 'profile present', 'gmb presence', 'gbp presence', 'profile status'],
  socialLinks: ['social links', 'social profiles', 'social urls', 'social'],
};

const AD_ALIASES = {
  advertiser: ['advertiser name', 'advertiser', 'page name', 'business name', 'brand', 'account name', 'name'],
  title: ['ad title', 'headline', 'creative title', 'title'],
  description: ['ad description', 'primary text', 'ad text', 'creative text', 'body', 'copy', 'description', 'caption'],
  status: ['ad status', 'active status', 'status', 'is active', 'active'],
  country: ['country', 'country code', 'ad reached countries'],
  city: ['city', 'delivery city', 'location city'],
  startDate: ['start date', 'delivery start time', 'first shown', 'started at', 'created time'],
  libraryId: ['library id', 'ad library id', 'ad id', 'archive id'],
  pageId: ['page id', 'advertiser page id'],
  adUrl: ['ad url', 'library url', 'snapshot url', 'permalink', 'link'],
  website: ['landing page url', 'destination url', 'website', 'website url'],
  platform: ['publisher platforms', 'platforms', 'platform', 'placement'],
};

const normalizeHeader = (value) => String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
const normalizeText = (value) => String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function randomId(prefix = 'row') {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${id}`;
}

function parseCsvRows(text) {
  const input = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((item) => String(item).trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => String(item).trim() !== '')) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map((header, index) => String(header || `column_${index + 1}`).trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? '').trim()])));
}

export function parseImportText(text, filename = '') {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) throw new Error('The selected file is empty.');
  const looksJson = /\.json$/i.test(filename) || trimmed.startsWith('[') || trimmed.startsWith('{');
  if (!looksJson) return parseCsvRows(trimmed);

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('This does not look like valid JSON.');
  }
  if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === 'object' && !Array.isArray(item));
  if (parsed && typeof parsed === 'object') {
    for (const key of ['records', 'businesses', 'ads', 'data', 'items']) {
      if (Array.isArray(parsed[key])) return parsed[key].filter((item) => item && typeof item === 'object' && !Array.isArray(item));
    }
  }
  throw new Error('JSON must contain an array of objects, or an object with a records/businesses/ads/data/items array.');
}

function lookup(row, aliases) {
  const keys = new Map(Object.keys(row || {}).map((key) => [normalizeHeader(key), key]));
  for (const alias of aliases) {
    const original = keys.get(normalizeHeader(alias));
    if (original !== undefined && String(row[original] ?? '').trim() !== '') return row[original];
  }
  return '';
}

function normalizeActive(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', 'yes', '1', 'active', 'running', 'live', 'on'].includes(text)) return 'Active';
  if (['false', 'no', '0', 'inactive', 'ended', 'not active', 'off', 'paused'].includes(text)) return 'Inactive';
  return text ? String(value).trim() : 'Unknown';
}

function cleanWebsite(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function parseSocialLinks(value, row = {}) {
  const collected = [];
  const raw = String(value ?? '').trim();
  if (raw) {
    raw.split(/[|;\n]+/).map((item) => item.trim()).filter(Boolean).forEach((item) => collected.push(item));
  }
  for (const [key, val] of Object.entries(row || {})) {
    const header = normalizeHeader(key);
    if (/^(facebook|instagram|linkedin|tiktok|youtube|twitter|x|threads|socialurl)$/.test(header) && String(val ?? '').trim()) {
      collected.push(String(val).trim());
    }
  }
  return [...new Set(collected)];
}

export function normalizeRecord(row, kind, source) {
  const values = kind === 'business' ? BUSINESS_ALIASES : AD_ALIASES;
  const nameValue = kind === 'business' ? lookup(row, values.name) : lookup(row, values.advertiser);
  const name = String(nameValue ?? '').trim();
  if (!name) return null;

  const common = {
    id: randomId(kind),
    kind,
    name,
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    licenseLabel: source.licenseLabel || 'Not specified',
    rightsNote: source.rightsNote || '',
    storageAllowed: Boolean(source.storageAllowed),
    exportAllowed: Boolean(source.exportAllowed),
    importedAt: source.importedAt,
    raw: { ...row },
  };

  if (kind === 'business') {
    const profileUrl = cleanWebsite(lookup(row, values.profileUrl));
    const explicitPresence = String(lookup(row, values.profilePresence) ?? '').trim();
    const hasProfile = Boolean(profileUrl) || ['yes', 'true', 'present', 'listed', '1'].includes(explicitPresence.toLowerCase());
    return {
      ...common,
      category: String(lookup(row, values.category) || '').trim(),
      address: String(lookup(row, values.address) || '').trim(),
      city: String(lookup(row, values.city) || '').trim(),
      state: String(lookup(row, values.state) || '').trim(),
      country: String(lookup(row, values.country) || '').trim(),
      website: cleanWebsite(lookup(row, values.website)),
      phone: String(lookup(row, values.phone) || '').trim(),
      email: String(lookup(row, values.email) || '').trim(),
      rating: String(lookup(row, values.rating) || '').trim(),
      reviewCount: String(lookup(row, values.reviewCount) || '').trim(),
      profileUrl,
      profilePresence: hasProfile ? 'Source reports profile' : (explicitPresence ? 'Source reports none' : 'Not supplied'),
      socialLinks: parseSocialLinks(lookup(row, values.socialLinks), row),
    };
  }

  return {
    ...common,
    title: String(lookup(row, values.title) || '').trim(),
    description: String(lookup(row, values.description) || '').trim(),
    status: normalizeActive(lookup(row, values.status)),
    country: String(lookup(row, values.country) || '').trim(),
    city: String(lookup(row, values.city) || '').trim(),
    startDate: String(lookup(row, values.startDate) || '').trim(),
    libraryId: String(lookup(row, values.libraryId) || '').trim(),
    pageId: String(lookup(row, values.pageId) || '').trim(),
    adUrl: cleanWebsite(lookup(row, values.adUrl)),
    website: cleanWebsite(lookup(row, values.website)),
    platform: String(lookup(row, values.platform) || '').trim(),
  };
}

export function normalizeRows(rows, kind, source) {
  const valid = [];
  const rejected = [];
  rows.slice(0, MAX_IMPORT_ROWS).forEach((row, index) => {
    const record = normalizeRecord(row, kind, source);
    if (record) valid.push(record);
    else rejected.push({ row: index + 2, reason: 'Missing business or advertiser name.' });
  });
  return { records: valid, rejected, truncated: rows.length > MAX_IMPORT_ROWS };
}

export function isExportable(record) {
  return Boolean(record?.storageAllowed && record?.exportAllowed);
}

export function isGoogleMapsSource(source) {
  return source?.type === 'google-maps' || /google\s*(maps|places)|places\s*api/i.test(`${source?.name || ''} ${source?.type || ''}`);
}

export function sourceAuthorizationError(source) {
  if (!source?.storageAllowed) return 'Confirm that you have the right to store and process this data.';
  if (isGoogleMapsSource(source) && !source.explicitWrittenPermission) {
    return 'Google Maps/Places-derived content cannot be imported into this standalone workspace under standard terms. Separate written permission covering storage is required.';
  }
  if (source?.type === 'meta' && !source.explicitAuthorization) {
    return 'For Meta data, confirm the source is an authorized API or otherwise expressly permitted for this use.';
  }
  if (source?.exportAllowed && !String(source?.rightsNote || '').trim()) {
    return 'Add a short note identifying the license or written permission that allows export.';
  }
  return '';
}

export function getDomain(value) {
  try {
    return new URL(cleanWebsite(value)).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function tokenSimilarity(a, b) {
  const left = new Set(normalizeText(a).split(' ').filter((token) => token.length > 1));
  const right = new Set(normalizeText(b).split(' ').filter((token) => token.length > 1));
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter((token) => right.has(token)).length;
  return overlap / new Set([...left, ...right]).size;
}

export function scoreBusinessAd(business, ad) {
  const businessName = business?.name || '';
  const adName = ad?.name || '';
  const name = normalizeText(businessName) === normalizeText(adName) && normalizeText(businessName) ? 1 : tokenSimilarity(businessName, adName);
  const businessDomain = getDomain(business?.website);
  const adDomain = getDomain(ad?.website);
  const domain = businessDomain && adDomain && businessDomain === adDomain ? 1 : 0;
  const city = normalizeText(business?.city) && normalizeText(business?.city) === normalizeText(ad?.city) ? 1 : 0;
  const country = normalizeText(business?.country) && normalizeText(business?.country) === normalizeText(ad?.country) ? 1 : 0;
  const score = Math.min(1, 0.58 * name + 0.34 * domain + 0.05 * city + 0.03 * country);
  const reasons = [];
  if (name === 1) reasons.push('Exact normalized name');
  else if (name >= 0.25) reasons.push(`Name overlap ${Math.round(name * 100)}%`);
  if (domain) reasons.push('Website domain matches');
  if (city) reasons.push('Same supplied city');
  if (country) reasons.push('Same supplied country');
  return { score, reasons, nameScore: name, domainMatch: Boolean(domain), cityMatch: Boolean(city), countryMatch: Boolean(country) };
}

export function buildSuggestions(businesses, ads, confirmed = [], dismissed = []) {
  const confirmedPairs = new Set(confirmed.map((match) => `${match.businessId}::${match.adId}`));
  const dismissedPairs = new Set(dismissed);
  const suggestions = [];
  for (const business of businesses) {
    for (const ad of ads) {
      const key = `${business.id}::${ad.id}`;
      if (confirmedPairs.has(key) || dismissedPairs.has(key)) continue;
      const evidence = scoreBusinessAd(business, ad);
      if (evidence.score >= 0.29) suggestions.push({ key, business, ad, ...evidence });
    }
  }
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 250);
}

export function csvStringify(records, columns) {
  const escape = (value) => {
    const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = columns.map((column) => escape(column.label)).join(',');
  const body = records.map((record) => columns.map((column) => escape(typeof column.value === 'function' ? column.value(record) : record[column.value])).join(','));
  return [header, ...body].join('\r\n');
}

export function detectDataKind(rows, filename = '') {
  if (/ad|creative|archive/i.test(filename)) return 'ad';
  const headers = new Set(Object.keys(rows[0] || {}).map(normalizeHeader));
  if (['advertiser', 'advertisername', 'pagename', 'primarytext', 'adtext', 'libraryid', 'publisherplatforms'].some((key) => headers.has(key))) return 'ad';
  return 'business';
}
