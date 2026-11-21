import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BadgeCheck, Building2, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleAlert, Clock3, Database, ExternalLink, FileText,
  Filter, Globe2, LayoutDashboard, Link2, LockKeyhole, Mail, MapPin, Megaphone, Menu,
  MoreHorizontal, Phone, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star,
  Trash2, Upload, X,
} from 'lucide-react';
import ImportModal from './components/ImportModal.jsx';
import { buildSuggestions, csvStringify, isExportable, scoreBusinessAd } from './lib/data.js';
import { createDemoWorkspace } from './lib/demoData.js';
import { clearWorkspace, loadWorkspace, saveWorkspace } from './lib/storage.js';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'ads', label: 'Ad records', icon: Megaphone },
  { id: 'matches', label: 'Match review', icon: Link2 },
  { id: 'sources', label: 'Sources & access', icon: Database },
];

const EMPTY_WORKSPACE = { version: 1, businesses: [], ads: [], sources: [], matches: [], dismissedMatches: [], isDemo: false };

function cx(...items) { return items.filter(Boolean).join(' '); }
function locationOf(item) { return [item.city, item.state].filter(Boolean).join(', ') || item.address || item.country || 'Location not supplied'; }
function cleanSearch(item) { return Object.values(item || {}).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ').toLowerCase(); }
function formatCount(value) { return new Intl.NumberFormat('en-US').format(value || 0); }
function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
function daysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}
function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
}
function safeUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function csvDownload(name, csv) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
function sourcePill(sourceType) {
  const labels = { demo: 'Demo', 'licensed-provider': 'Licensed', 'user-file': 'User file', 'open-data': 'Open data', meta: 'Meta API', 'google-maps': 'Google Maps', manual: 'Manual', other: 'Other' };
  return labels[sourceType] || 'Imported';
}
function pct(score) { return `${Math.round(score * 100)}%`; }

function StatCard({ icon: Icon, label, value, detail, tone = 'green' }) {
  return (
    <article className="stat-card">
      <div className={cx('stat-icon', `tone-${tone}`)}><Icon size={17} /></div>
      <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
      <span className="stat-mark" aria-hidden="true" />
    </article>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

function ExportButton({ count, excluded, onClick, label = 'Export CSV' }) {
  return (
    <div className="export-wrap">
      <button className="button button-secondary" type="button" onClick={onClick} disabled={!count} title={count ? `${count} permitted records` : 'No records with export permission'}>
        <ArrowDownToLine size={16} />{label}<span className="button-count">{formatCount(count)}</span>
      </button>
      {excluded > 0 && <span className="export-note">{formatCount(excluded)} withheld by source rights</span>}
    </div>
  );
}

function SourceTag({ record }) {
  return <span className={cx('source-tag', record?.sourceType === 'demo' && 'source-tag-demo')}><span className="source-dot" />{sourcePill(record?.sourceType)}</span>;
}

function EmptyState({ icon: Icon = FileText, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={21} /></div><strong>{title}</strong><p>{description}</p>{action}</div>;
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="filter-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} /></label>;
}

function BusinessTable({ records, onOpen }) {
  if (!records.length) return <EmptyState icon={Building2} title="No business records match" description="Adjust the filters or import a file with business data." />;
  return (
    <div className="table-scroll"><table className="data-table business-table">
      <thead><tr><th>Business</th><th>Location</th><th>Touchpoints</th><th>Profile & reviews</th><th>Source rights</th><th aria-label="Actions" /></tr></thead>
      <tbody>{records.map((business) => (
        <tr key={business.id}>
          <td><div className="identity-cell"><span className="avatar avatar-business">{initials(business.name)}</span><div><button className="text-link strong-link" type="button" onClick={() => onOpen(business)}>{business.name}</button><span>{business.category || 'Category not supplied'}</span></div></div></td>
          <td><div className="location-cell"><MapPin size={14} /><span>{locationOf(business)}</span></div><small className="subtle-line">{business.country || ''}</small></td>
          <td><div className="touchpoints">
            {business.website && <a href={safeUrl(business.website)} target="_blank" rel="noreferrer" className="touchpoint" title={business.website}><Globe2 size={13} /> Website</a>}
            {business.email && <span className="touchpoint" title={business.email}><Mail size={13} /> Email</span>}
            {business.phone && <span className="touchpoint" title={business.phone}><Phone size={13} /> Phone</span>}
            {business.socialLinks?.length > 0 && <span className="touchpoint social-touch" title={business.socialLinks.join(', ')}><Link2 size={13} /> {business.socialLinks.length} social</span>}
            {!business.website && !business.email && !business.phone && !business.socialLinks?.length && <span className="muted">No contact fields</span>}
          </div></td>
          <td><div className="profile-cell"><span className={cx('presence-dot', business.profileUrl && 'is-present')} />{business.profilePresence || 'Not supplied'}</div><div className="rating-line">{business.rating ? <><Star size={13} fill="currentColor" /> {business.rating} <span>· {business.reviewCount || '—'} reviews</span></> : <span className="muted">No rating supplied</span>}</div></td>
          <td><SourceTag record={business} /><div className={cx('rights-line', isExportable(business) ? 'rights-ok' : 'rights-no')}><span />{isExportable(business) ? 'Export permitted' : 'Export restricted'}</div></td>
          <td><button className="icon-button row-action" type="button" onClick={() => onOpen(business)} aria-label={`Open ${business.name}`}><MoreHorizontal size={17} /></button></td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function AdsTable({ records, activeCounts }) {
  if (!records.length) return <EmptyState icon={Megaphone} title="No ad records match" description="Adjust the filters or import an authorized ad-research file." />;
  return (
    <div className="table-scroll"><table className="data-table ads-table">
      <thead><tr><th>Advertiser & creative</th><th>Delivery details</th><th>Activity signal</th><th>Reference</th><th>Source rights</th></tr></thead>
      <tbody>{records.map((ad) => {
        const link = safeUrl(ad.adUrl);
        const duration = ad.status === 'Active' ? daysSince(ad.startDate) : null;
        return <tr key={ad.id}>
          <td><div className="ad-identity"><span className="avatar avatar-ad"><Megaphone size={16} /></span><div><strong>{ad.name}</strong><span>{ad.title || ad.description || 'Creative text not supplied'}</span>{ad.description && ad.title && <small>{ad.description}</small>}</div></div></td>
          <td><span className={cx('status-pill', ad.status === 'Active' ? 'status-active' : ad.status === 'Inactive' ? 'status-inactive' : 'status-unknown')}><i />{ad.status}</span><div className="ad-location">{[ad.city, ad.country].filter(Boolean).join(', ') || 'Location not supplied'}</div><small>{ad.platform || 'Placement not supplied'}</small></td>
          <td><div className="activity-number">{formatCount(activeCounts[ad.name] || 0)} <span>active creative{(activeCounts[ad.name] || 0) === 1 ? '' : 's'} from this file</span></div><div className="activity-days">{duration !== null ? <><Clock3 size={13} /> {duration} days since supplied start date</> : `Start: ${dateLabel(ad.startDate)}`}</div></td>
          <td>{link ? <a className="reference-link" href={link} target="_blank" rel="noreferrer">Open source <ExternalLink size={13} /></a> : <span className="muted">No source link</span>}<small className="subtle-line">{ad.libraryId ? `ID ${ad.libraryId}` : ad.pageId ? `Page ${ad.pageId}` : 'No library ID'}</small></td>
          <td><SourceTag record={ad} /><div className={cx('rights-line', isExportable(ad) ? 'rights-ok' : 'rights-no')}><span />{isExportable(ad) ? 'Export permitted' : 'Export restricted'}</div></td>
        </tr>;
      })}</tbody>
    </table></div>
  );
}

function MatchCard({ item, onConfirm, onDismiss }) {
  return (
    <article className="match-card">
      <div className="match-score-block"><span className="eyebrow">SUGGESTED</span><strong>{pct(item.score)}</strong><div className="score-track"><i style={{ width: pct(item.score) }} /></div><span>review required</span></div>
      <div className="match-body">
        <div className="match-pair">
          <div className="match-entity"><span className="avatar avatar-business">{initials(item.business.name)}</span><div><small>BUSINESS RECORD</small><strong>{item.business.name}</strong><span>{locationOf(item.business)}</span></div></div>
          <ArrowRight className="match-arrow" size={17} />
          <div className="match-entity"><span className="avatar avatar-ad"><Megaphone size={14} /></span><div><small>ADVERTISER RECORD</small><strong>{item.ad.name}</strong><span>{[item.ad.city, item.ad.country].filter(Boolean).join(', ') || 'Location not supplied'}</span></div></div>
        </div>
        <div className="evidence-row">{item.reasons.map((reason) => <span key={reason}><Check size={12} />{reason}</span>)}</div>
        <p className="match-disclaimer">Name/domain/location similarity only. This is a candidate, not a verified business-to-ad relationship.</p>
      </div>
      <div className="match-actions"><button className="button button-primary button-small" type="button" onClick={() => onConfirm(item)}><Check size={14} /> Confirm link</button><button className="button button-quiet button-small" type="button" onClick={() => onDismiss(item)}>Dismiss</button></div>
    </article>
  );
}

function SourceRow({ source, businessCount, adCount }) {
  const count = businessCount + adCount;
  return <article className="source-row"><div className="source-symbol"><Database size={17} /></div><div className="source-main"><strong>{source.name}</strong><span>{source.licenseLabel || 'License not specified'} · {dateLabel(source.importedAt)}</span><small>{source.rightsNote || 'No rights note recorded'}</small></div><div className="source-count">{formatCount(count)} <span>records</span></div><div className="source-rights"><span className={cx('rights-chip', source.storageAllowed ? 'rights-ok' : 'rights-no')}>{source.storageAllowed ? 'Storage declared' : 'Storage not declared'}</span><span className={cx('rights-chip', source.exportAllowed ? 'rights-ok' : 'rights-no')}>{source.exportAllowed ? 'Export declared' : 'Export not declared'}</span></div></article>;
}

export default function App() {
  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
  const [storageReady, setStorageReady] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [query, setQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importKind, setImportKind] = useState('business');
  const [toast, setToast] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [manualBusiness, setManualBusiness] = useState('');
  const [manualAd, setManualAd] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const searchInputRef = useRef(null);
  const [businessFilters, setBusinessFilters] = useState({ country: 'All', state: 'All', city: 'All', website: 'All', email: 'All', export: 'All' });
  const [adFilters, setAdFilters] = useState({ country: 'All', city: 'All', status: 'All' });
  const [toastTimer, setToastTimer] = useState(null);

  useEffect(() => {
    let active = true;
    loadWorkspace().then((saved) => {
      if (!active) return;
      setWorkspace(saved || createDemoWorkspace());
      setStorageReady(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    saveWorkspace(workspace).then((ok) => {
      if (!ok) setToast('Browser storage is full or unavailable. Export permitted records and remove unused data.');
    });
  }, [workspace, storageReady]);
  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);
  useEffect(() => () => { if (toastTimer) clearTimeout(toastTimer); }, [toastTimer]);

  const notify = (message) => {
    setToast(message);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => setToast(''), 3400);
    setToastTimer(timer);
  };

  const suggestions = useMemo(() => buildSuggestions(workspace.businesses, workspace.ads, workspace.matches, workspace.dismissedMatches), [workspace.businesses, workspace.ads, workspace.matches, workspace.dismissedMatches]);
  const activeAds = workspace.ads.filter((ad) => ad.status === 'Active');
  const activeCounts = workspace.ads.reduce((out, ad) => { if (ad.status === 'Active') out[ad.name] = (out[ad.name] || 0) + 1; return out; }, {});
  const exportableBusinesses = workspace.businesses.filter(isExportable);
  const exportableAds = workspace.ads.filter(isExportable);
  const sources = workspace.sources || [];

  const distinctOptions = (items, key) => [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const countries = distinctOptions(workspace.businesses, 'country');
  const states = distinctOptions(workspace.businesses.filter((item) => businessFilters.country === 'All' || item.country === businessFilters.country), 'state');
  const cities = distinctOptions(workspace.businesses.filter((item) => (businessFilters.country === 'All' || item.country === businessFilters.country) && (businessFilters.state === 'All' || item.state === businessFilters.state)), 'city');
  const adCountries = distinctOptions(workspace.ads, 'country');
  const adCities = distinctOptions(workspace.ads.filter((item) => adFilters.country === 'All' || item.country === adFilters.country), 'city');

  const filteredBusinesses = workspace.businesses.filter((item) => {
    const searchable = cleanSearch(item);
    return (!query || searchable.includes(query.toLowerCase()))
      && (businessFilters.country === 'All' || item.country === businessFilters.country)
      && (businessFilters.state === 'All' || item.state === businessFilters.state)
      && (businessFilters.city === 'All' || item.city === businessFilters.city)
      && (businessFilters.website === 'All' || (businessFilters.website === 'Yes' ? Boolean(item.website) : !item.website))
      && (businessFilters.email === 'All' || (businessFilters.email === 'Yes' ? Boolean(item.email) : !item.email))
      && (businessFilters.export === 'All' || (businessFilters.export === 'Yes' ? isExportable(item) : !isExportable(item)));
  });
  const filteredAds = workspace.ads.filter((item) => (!query || cleanSearch(item).includes(query.toLowerCase()))
    && (adFilters.country === 'All' || item.country === adFilters.country)
    && (adFilters.city === 'All' || item.city === adFilters.city)
    && (adFilters.status === 'All' || item.status === adFilters.status));
  const visibleSuggestions = suggestions.filter((item) => (!query || cleanSearch({ ...item.business, ...item.ad }).includes(query.toLowerCase())));
  const filteredMatches = workspace.matches.filter((match) => {
    const business = workspace.businesses.find((item) => item.id === match.businessId);
    const ad = workspace.ads.find((item) => item.id === match.adId);
    return business && ad && (!query || cleanSearch({ ...business, ...ad }).includes(query.toLowerCase()));
  });

  const openImport = (kind = 'business') => { setImportKind(kind); setImportOpen(true); setMobileNavOpen(false); };
  const handleImport = ({ kind, source, records, rejected, truncated }) => {
    setWorkspace((current) => ({
      ...current,
      businesses: kind === 'business' ? [...current.businesses.filter((row) => row.sourceType !== 'demo'), ...records] : current.businesses.filter((row) => row.sourceType !== 'demo'),
      ads: kind === 'ad' ? [...current.ads.filter((row) => row.sourceType !== 'demo'), ...records] : current.ads.filter((row) => row.sourceType !== 'demo'),
      sources: [...current.sources.filter((item) => item.type !== 'demo'), source],
      matches: current.matches.filter((match) => match.businessSourceType !== 'demo' && match.adSourceType !== 'demo'),
      isDemo: false,
    }));
    setActivePage(kind === 'business' ? 'businesses' : 'ads');
    const suffix = rejected.length ? ` · ${rejected.length} skipped` : '';
    notify(`Imported ${records.length} ${kind === 'business' ? 'business' : 'ad'} records${suffix}${truncated ? ' · row cap applied' : ''}.`);
  };

  const downloadBusinesses = () => {
    const eligible = filteredBusinesses.filter(isExportable);
    const columns = [
      { label: 'Business name', value: 'name' }, { label: 'Category', value: 'category' }, { label: 'Address', value: 'address' },
      { label: 'City', value: 'city' }, { label: 'State', value: 'state' }, { label: 'Country', value: 'country' },
      { label: 'Website', value: 'website' }, { label: 'Social links', value: 'socialLinks' }, { label: 'Phone', value: 'phone' },
      { label: 'Email', value: 'email' }, { label: 'Rating (source supplied)', value: 'rating' }, { label: 'Review count (source supplied)', value: 'reviewCount' },
      { label: 'Profile URL (source supplied)', value: 'profileUrl' }, { label: 'Profile presence (source supplied)', value: 'profilePresence' },
      { label: 'Source', value: 'sourceName' }, { label: 'License label', value: 'licenseLabel' }, { label: 'Rights note', value: 'rightsNote' },
      { label: 'Imported at', value: 'importedAt' }, { label: 'Original fields JSON', value: (row) => JSON.stringify(row.raw || {}) },
    ];
    if (!eligible.length) return notify('No filtered business records have export permission.');
    csvDownload('localscope-businesses.csv', csvStringify(eligible, columns));
    notify(`Exported ${eligible.length}; ${filteredBusinesses.length - eligible.length} restricted record(s) were excluded.`);
  };

  const downloadAds = () => {
    const eligible = filteredAds.filter(isExportable);
    const columns = [
      { label: 'Advertiser', value: 'name' }, { label: 'Ad title', value: 'title' }, { label: 'Ad description', value: 'description' },
      { label: 'Active status (source supplied)', value: 'status' }, { label: 'Country', value: 'country' }, { label: 'City (source supplied)', value: 'city' },
      { label: 'Start date (source supplied)', value: 'startDate' }, { label: 'Library ID', value: 'libraryId' }, { label: 'Page ID', value: 'pageId' },
      { label: 'Ad source URL', value: 'adUrl' }, { label: 'Website', value: 'website' }, { label: 'Platform', value: 'platform' },
      { label: 'Source', value: 'sourceName' }, { label: 'License label', value: 'licenseLabel' }, { label: 'Rights note', value: 'rightsNote' },
      { label: 'Imported at', value: 'importedAt' }, { label: 'Original fields JSON', value: (row) => JSON.stringify(row.raw || {}) },
    ];
    if (!eligible.length) return notify('No filtered ad records have export permission.');
    csvDownload('localscope-ad-records.csv', csvStringify(eligible, columns));
    notify(`Exported ${eligible.length}; ${filteredAds.length - eligible.length} restricted record(s) were excluded.`);
  };

  const downloadMatches = () => {
    const rows = filteredMatches.map((match) => ({
      ...match,
      business: workspace.businesses.find((item) => item.id === match.businessId),
      ad: workspace.ads.find((item) => item.id === match.adId),
    })).filter((item) => item.business && item.ad && isExportable(item.business) && isExportable(item.ad));
    if (!rows.length) return notify('No confirmed matches have export permission from both sources.');
    const columns = [
      { label: 'Business', value: (row) => row.business.name }, { label: 'Advertiser', value: (row) => row.ad.name },
      { label: 'Confidence (human-confirmed)', value: (row) => `${Math.round(row.score * 100)}%` }, { label: 'Reasons', value: (row) => (row.reasons || []).join(' · ') },
      { label: 'Business source', value: (row) => row.business.sourceName }, { label: 'Ad source', value: (row) => row.ad.sourceName },
      { label: 'Confirmed at', value: 'confirmedAt' },
    ];
    csvDownload('localscope-confirmed-matches.csv', csvStringify(rows, columns));
    notify(`Exported ${rows.length} confirmed matches.`);
  };

  const confirmMatch = (item) => {
    const match = {
      id: `match-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`,
      businessId: item.business.id, adId: item.ad.id, score: item.score, reasons: item.reasons,
      businessSourceType: item.business.sourceType, adSourceType: item.ad.sourceType,
      confirmedAt: new Date().toISOString(), status: 'confirmed',
    };
    setWorkspace((current) => ({ ...current, matches: [...current.matches, match] }));
    notify('Match confirmed. The source and score remain attached.');
  };
  const dismissMatch = (item) => {
    setWorkspace((current) => ({ ...current, dismissedMatches: [...new Set([...current.dismissedMatches, item.key])] }));
    notify('Suggestion dismissed.');
  };
  const createManualMatch = () => {
    if (!manualBusiness || !manualAd) return notify('Choose both a business and an ad record.');
    const business = workspace.businesses.find((item) => item.id === manualBusiness);
    const ad = workspace.ads.find((item) => item.id === manualAd);
    if (!business || !ad) return notify('The selected records are no longer in the workspace.');
    const score = scoreBusinessAd(business, ad);
    confirmMatch({ business, ad, score: score.score, reasons: [...score.reasons, 'Manually confirmed by user'] });
    setManualBusiness('');
    setManualAd('');
  };

  const clearLocalData = async () => {
    if (!window.confirm('Clear all businesses, ads, source notes, and matches stored by LocalScope in this browser? This cannot be undone.')) return;
    const cleared = await clearWorkspace();
    if (!cleared) return notify('The browser could not confirm that all local data was cleared. Retry after closing other LocalScope tabs.');
    setWorkspace(EMPTY_WORKSPACE);
    setQuery('');
    notify('Local workspace cleared.');
  };
  const loadDemo = () => {
    setWorkspace(createDemoWorkspace());
    setActivePage('overview');
    notify('Loaded fictional demo records.');
  };

  const currentNav = NAV_ITEMS.find((item) => item.id === activePage);
  const headerActions = (
    <div className="header-actions">
      <button className="button button-secondary import-action" type="button" onClick={() => openImport(activePage === 'ads' ? 'ad' : 'business')}><Upload size={15} />Import file</button>
      <button className="button button-primary" type="button" onClick={() => openImport('business')}><Plus size={16} />Add data</button>
    </div>
  );

  return (
    <div className="app-shell">
      <aside className={cx('sidebar', mobileNavOpen && 'sidebar-open')}>
        <div className="brand-lockup"><span className="brand-mark"><i /><i /><i /></span><div><strong>LocalScope</strong><span>RESEARCH WORKSPACE</span></div><button className="icon-button mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="workspace-switcher"><div className="workspace-avatar">LS</div><div><span>Workspace</span><strong>Local research</strong></div><ChevronDown size={14} /></div>
        <nav className="side-nav" aria-label="Main navigation">
          <span className="nav-caption">WORKSPACE</span>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={cx('nav-link', activePage === id && 'nav-link-active')} onClick={() => { setActivePage(id); setMobileNavOpen(false); }}><Icon size={17} /><span>{label}</span>{id === 'matches' && suggestions.length > 0 && <small>{suggestions.length}</small>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card"><div className="local-card-icon"><LockKeyhole size={15} /></div><div><strong>Local by default</strong><span>Files stay in this browser</span></div><span className="local-status-dot" /></div>
          <button className="settings-link" type="button" onClick={() => setActivePage('sources')}><SlidersHorizontal size={15} />Source permissions</button>
          <div className="user-mini"><span className="user-avatar">LS</span><div><strong>Local workspace</strong><span>No account connected</span></div><MoreHorizontal size={16} /></div>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-sep">/</span><strong>{currentNav?.label || 'Overview'}</strong></div></div>
          <div className="topbar-right"><div className="local-indicator"><span className="local-status-dot" />LOCAL ONLY</div><button className="icon-button topbar-help" type="button" onClick={() => setActivePage('sources')} aria-label="Source and access guidance"><CircleAlert size={17} /></button><span className="topbar-avatar">LS</span></div>
        </header>

        <section className="content-area">
          {activePage === 'overview' && <>
            <PageHeader eyebrow="LOCAL WORKSPACE" title="Market research" description="Organize authorized business and ad records, then review potential connections." action={headerActions} />
            {workspace.isDemo && <div className="demo-banner"><Sparkles size={16} /><span><strong>Fictional demo workspace.</strong> These sample businesses, contact details and ads are invented for the interface preview.</span><button type="button" onClick={() => openImport('business')}>Replace with your file <ArrowRight size={14} /></button></div>}
            <div className="privacy-banner"><ShieldCheck size={16} /><span><strong>No live scraping or API calls.</strong> Imports are processed locally; source permissions must be checked before export.</span><button type="button" onClick={() => setActivePage('sources')}>Review data rules <ArrowUpRight size={14} /></button></div>
            <div className="stats-grid">
              <StatCard icon={Building2} label="Businesses" value={formatCount(workspace.businesses.length)} detail={`${formatCount(exportableBusinesses.length)} export-permitted`} tone="green" />
              <StatCard icon={Activity} label="Active ad records" value={formatCount(activeAds.length)} detail="Status supplied by source" tone="blue" />
              <StatCard icon={Link2} label="To review" value={formatCount(suggestions.length)} detail="Candidate links · not verified" tone="amber" />
              <StatCard icon={BadgeCheck} label="Confirmed matches" value={formatCount(workspace.matches.length)} detail="Human-reviewed links" tone="violet" />
            </div>
            <div className="overview-grid">
              <section className="panel overview-business-panel">
                <div className="panel-heading"><div><span className="eyebrow">BUSINESS DIRECTORY</span><h2>Recently added</h2></div><button className="text-link panel-link" onClick={() => setActivePage('businesses')}>View all <ArrowRight size={14} /></button></div>
                {workspace.businesses.length ? <div className="recent-list">{workspace.businesses.slice(0, 5).map((business) => <button key={business.id} className="recent-row" onClick={() => { setSelectedRecord(business); setActivePage('businesses'); }}><span className="avatar avatar-business">{initials(business.name)}</span><span className="recent-main"><strong>{business.name}</strong><small>{business.category || 'Category not supplied'} · {locationOf(business)}</small></span><SourceTag record={business} /><ChevronDown className="recent-chevron" size={15} /></button>)}</div> : <EmptyState icon={Building2} title="No business data yet" description="Import an authorized CSV or JSON file to start a workspace." action={<button className="button button-primary button-small" onClick={() => openImport('business')}><Upload size={14} />Import businesses</button>} />}
                <div className="panel-footer"><span><LockKeyhole size={13} /> {formatCount(exportableBusinesses.length)} of {formatCount(workspace.businesses.length)} business records are export-permitted</span><button className="text-link" onClick={() => setActivePage('sources')}>Source details</button></div>
              </section>
              <section className="panel overview-match-panel">
                <div className="panel-heading"><div><span className="eyebrow">BUSINESS ↔ AD</span><h2>Match review</h2></div><span className="count-bubble">{suggestions.length}</span></div>
                {suggestions.length ? <div className="mini-match-list">{suggestions.slice(0, 4).map((item) => <button key={item.key} className="mini-match-row" onClick={() => setActivePage('matches')}><span className="mini-match-score">{pct(item.score)}</span><span><strong>{item.business.name}</strong><small>may match {item.ad.name}</small></span><ArrowRight size={15} /></button>)}</div> : <EmptyState icon={Link2} title="No suggestions to review" description="Import businesses and ad records to calculate candidate matches locally." />}
                <div className="match-method-note"><CircleAlert size={14} /><span>Scores use name, domain and supplied location only. Confirm each link manually.</span></div>
              </section>
            </div>
            <section className="activity-strip"><div className="activity-strip-icon"><Database size={16} /></div><div><strong>{sources.length ? `${sources.length} data source${sources.length === 1 ? '' : 's'} in this workspace` : 'No data sources yet'}</strong><span>{sources.length ? 'Source rights and import dates are stored with each batch.' : 'Every import needs a source name and separate storage/export rights.'}</span></div><button className="button button-quiet button-small" onClick={() => setActivePage('sources')}>Manage sources <ArrowRight size={14} /></button></section>
          </>}

          {activePage === 'businesses' && <>
            <PageHeader eyebrow="BUSINESS RECORDS" title="Businesses" description="Filter only the data you imported. Profile, review and contact fields are source-reported—not live-verified." action={<div className="header-actions"><ExportButton count={filteredBusinesses.filter(isExportable).length} excluded={filteredBusinesses.length - filteredBusinesses.filter(isExportable).length} onClick={downloadBusinesses} /><button className="button button-primary" onClick={() => openImport('business')}><Plus size={16} />Import businesses</button></div>} />
            <div className="table-toolbar"><div className="search-field"><Search size={16} /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search businesses, contacts, source fields…" /><kbd>⌘ K</kbd></div><div className="filter-group"><span className="filter-intro"><Filter size={14} /> FILTERS</span><FilterSelect label="Country" value={businessFilters.country} onChange={(value) => setBusinessFilters((current) => ({ ...current, country: value, state: 'All', city: 'All' }))} options={[{ value: 'All', label: 'All countries' }, ...countries.map((value) => ({ value, label: value }))]} /><FilterSelect label="State" value={businessFilters.state} onChange={(value) => setBusinessFilters((current) => ({ ...current, state: value, city: 'All' }))} options={[{ value: 'All', label: 'All states' }, ...states.map((value) => ({ value, label: value }))]} /><FilterSelect label="City" value={businessFilters.city} onChange={(value) => setBusinessFilters((current) => ({ ...current, city: value }))} options={[{ value: 'All', label: 'All cities' }, ...cities.map((value) => ({ value, label: value }))]} /></div></div>
            <div className="secondary-filters"><FilterSelect label="Website" value={businessFilters.website} onChange={(value) => setBusinessFilters((current) => ({ ...current, website: value }))} options={[{ value: 'All', label: 'Any website' }, { value: 'Yes', label: 'Website supplied' }, { value: 'No', label: 'No website supplied' }]} /><FilterSelect label="Email" value={businessFilters.email} onChange={(value) => setBusinessFilters((current) => ({ ...current, email: value }))} options={[{ value: 'All', label: 'Any email status' }, { value: 'Yes', label: 'Email supplied' }, { value: 'No', label: 'No email supplied' }]} /><FilterSelect label="Export rights" value={businessFilters.export} onChange={(value) => setBusinessFilters((current) => ({ ...current, export: value }))} options={[{ value: 'All', label: 'All rights statuses' }, { value: 'Yes', label: 'Export permitted' }, { value: 'No', label: 'Restricted / unknown' }]} /><span className="results-count">{formatCount(filteredBusinesses.length)} records</span></div>
            <section className="panel data-panel"><div className="data-panel-head"><div><strong>Business records</strong><span>Only rows with storage and export rights are included in CSV.</span></div><span className="table-source-note"><LockKeyhole size={13} />Local workspace</span></div><BusinessTable records={filteredBusinesses} onOpen={setSelectedRecord} /><div className="table-footnote"><CircleAlert size={14} />Ratings, review counts, contact details and profile presence are imported claims; verify before relying on them.</div></section>
          </>}

          {activePage === 'ads' && <>
            <PageHeader eyebrow="AD RESEARCH RECORDS" title="Ad records" description="Review user-supplied ad listings and descriptive activity signals—not campaign performance." action={<div className="header-actions"><ExportButton count={filteredAds.filter(isExportable).length} excluded={filteredAds.length - filteredAds.filter(isExportable).length} onClick={downloadAds} /><button className="button button-primary" onClick={() => openImport('ad')}><Plus size={16} />Import ads</button></div>} />
            <div className="ad-metric-row"><div><span className="metric-label">ACTIVE RECORDS</span><strong>{formatCount(filteredAds.filter((ad) => ad.status === 'Active').length)}</strong><small>as marked in the imported file</small></div><div><span className="metric-label">ADVERTISERS</span><strong>{formatCount(new Set(filteredAds.map((ad) => ad.name)).size)}</strong><small>unique names in current view</small></div><div><span className="metric-label">CREATIVE VARIANTS</span><strong>{formatCount(filteredAds.length)}</strong><small>record count only—not spend or reach</small></div><div className="metric-disclaimer"><Activity size={16} /><span>“Campaign significance” is limited to supplied status, start date and creative count. No performance inference is made.</span></div></div>
            <div className="table-toolbar ads-toolbar"><div className="search-field"><Search size={16} /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search advertiser, copy, IDs…" /><kbd>⌘ K</kbd></div><div className="filter-group"><span className="filter-intro"><Filter size={14} /> FILTERS</span><FilterSelect label="Country" value={adFilters.country} onChange={(value) => setAdFilters((current) => ({ ...current, country: value, city: 'All' }))} options={[{ value: 'All', label: 'All countries' }, ...adCountries.map((value) => ({ value, label: value }))]} /><FilterSelect label="City (from file)" value={adFilters.city} onChange={(value) => setAdFilters((current) => ({ ...current, city: value }))} options={[{ value: 'All', label: 'All supplied cities' }, ...adCities.map((value) => ({ value, label: value }))]} /><FilterSelect label="Status" value={adFilters.status} onChange={(value) => setAdFilters((current) => ({ ...current, status: value }))} options={[{ value: 'All', label: 'All statuses' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Unknown', label: 'Unknown' }]} /></div></div>
            <section className="panel data-panel"><div className="data-panel-head"><div><strong>Ad listings</strong><span>City, status, start date and links are shown only when included by your source.</span></div><span className="table-source-note"><LockKeyhole size={13} />Imported data only</span></div><AdsTable records={filteredAds} activeCounts={activeCounts} /><div className="table-footnote"><CircleAlert size={14} />No city-level Meta search, commercial spend, impressions, reach or ROI is fetched by this local app.</div></section>
          </>}

          {activePage === 'matches' && <>
            <PageHeader eyebrow="HUMAN REVIEW" title="Business ↔ ad matches" description="Review possible links between imported records. A score is a lead for review—not proof of ownership." action={<ExportButton count={filteredMatches.filter((match) => {
              const business = workspace.businesses.find((item) => item.id === match.businessId);
              const ad = workspace.ads.find((item) => item.id === match.adId);
              return business && ad && isExportable(business) && isExportable(ad);
            }).length} excluded={filteredMatches.filter((match) => {
              const business = workspace.businesses.find((item) => item.id === match.businessId);
              const ad = workspace.ads.find((item) => item.id === match.adId);
              return business && ad && (!isExportable(business) || !isExportable(ad));
            }).length} onClick={downloadMatches} label="Export matches" />} />
            <section className="manual-match-panel"><div className="manual-match-copy"><span className="eyebrow">MANUAL LINK</span><strong>Connect records yourself</strong><span>Use your own review when names differ or imported fields are incomplete.</span></div><div className="manual-match-controls"><select aria-label="Choose business" value={manualBusiness} onChange={(event) => setManualBusiness(event.target.value)}><option value="">Choose a business…</option>{workspace.businesses.map((item) => <option key={item.id} value={item.id}>{item.name} · {locationOf(item)}</option>)}</select><ArrowRight size={16} /><select aria-label="Choose ad record" value={manualAd} onChange={(event) => setManualAd(event.target.value)}><option value="">Choose an ad / advertiser…</option>{workspace.ads.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.status}</option>)}</select><button className="button button-primary button-small" onClick={createManualMatch} disabled={!manualBusiness || !manualAd}><Link2 size={14} />Confirm link</button></div></section>
            {visibleSuggestions.length > 0 && <div className="section-divider"><div><span className="eyebrow">CANDIDATES</span><h2>Suggested for review <span>{visibleSuggestions.length}</span></h2></div><p>Sorted by name, domain and supplied location evidence.</p></div>}
            <div className="match-list">{visibleSuggestions.map((item) => <MatchCard key={item.key} item={item} onConfirm={confirmMatch} onDismiss={dismissMatch} />)}</div>
            {filteredMatches.length > 0 && <div className="confirmed-section"><div className="section-divider"><div><span className="eyebrow">CONFIRMED BY YOU</span><h2>Linked records <span>{filteredMatches.length}</span></h2></div><span className="confirmed-label"><CheckCircle2 size={14} />Human-confirmed</span></div><div className="confirmed-list">{filteredMatches.map((match) => {
              const business = workspace.businesses.find((item) => item.id === match.businessId);
              const ad = workspace.ads.find((item) => item.id === match.adId);
              if (!business || !ad) return null;
              return <article className="confirmed-row" key={match.id}><CheckCircle2 size={18} /><div><strong>{business.name}<span>↔</span>{ad.name}</strong><small>{pct(match.score)} original score · confirmed {dateLabel(match.confirmedAt)}</small></div><div className="confirmed-sources"><SourceTag record={business} /><SourceTag record={ad} /></div><span className={cx('rights-line', isExportable(business) && isExportable(ad) ? 'rights-ok' : 'rights-no')}><span />{isExportable(business) && isExportable(ad) ? 'Exportable' : 'Restricted'}</span><button className="icon-button" title="Remove confirmed match" onClick={() => setWorkspace((current) => ({ ...current, matches: current.matches.filter((item) => item.id !== match.id) }))}><X size={15} /></button></article>;
            })}</div></div>}
            {!visibleSuggestions.length && !filteredMatches.length && <div className="panel empty-match-panel"><EmptyState icon={Link2} title="Nothing to review yet" description="Import business and ad records to see suggestions, or create a manual link above." action={<div className="empty-actions"><button className="button button-secondary button-small" onClick={() => openImport('business')}><Upload size={14} />Import businesses</button><button className="button button-primary button-small" onClick={() => openImport('ad')}><Upload size={14} />Import ads</button></div>} /></div>}
          </>}

          {activePage === 'sources' && <>
            <PageHeader eyebrow="PROVENANCE & PERMISSIONS" title="Sources & access" description="Keep source rights visible. Import declarations are self-attested and do not replace provider terms or legal review." action={<button className="button button-primary" onClick={() => openImport('business')}><Plus size={16} />Add source data</button>} />
            <div className="source-summary-grid"><div className="source-summary-card"><span className="summary-icon"><Database size={16} /></span><span>Imported batches</span><strong>{sources.length}</strong><small>{formatCount(workspace.businesses.length + workspace.ads.length)} records in this browser</small></div><div className="source-summary-card"><span className="summary-icon summary-icon-green"><ShieldCheck size={16} /></span><span>Export-permitted rows</span><strong>{formatCount(exportableBusinesses.length + exportableAds.length)}</strong><small>Must be supported by source terms</small></div><div className="source-summary-card"><span className="summary-icon summary-icon-amber"><LockKeyhole size={16} /></span><span>External connectors</span><strong>0</strong><small>No API keys or remote requests</small></div></div>
            <section className="panel sources-panel"><div className="panel-heading"><div><span className="eyebrow">SOURCE LEDGER</span><h2>Imported batches</h2></div><span className="table-source-note"><LockKeyhole size={13} />Browser storage</span></div>
              {sources.length ? <div className="source-list">{sources.map((source) => <SourceRow key={source.id} source={source} businessCount={workspace.businesses.filter((record) => record.sourceId === source.id).length} adCount={workspace.ads.filter((record) => record.sourceId === source.id).length} />)}</div> : <EmptyState icon={Database} title="No imported sources" description="Add a user-supplied file or data from a provider whose terms permit your intended storage and export." action={<button className="button button-primary button-small" onClick={() => openImport('business')}><Upload size={14} />Import a file</button>} />}
            </section>
            <div className="access-grid">
              <article className="access-card access-blocked"><div className="access-top"><span className="access-logo google-logo">G</span><span className="access-status status-restricted">Export restricted</span></div><h3>Google Maps / Places</h3><p>Standard terms prohibit exporting Maps-derived business listings to a standalone CSV/Sheets prospect database. No Google connector is included.</p><ul><li>Do not use a paid API or third-party scraper to bypass this limit.</li><li>Use only an eligible in-app display flow, or secure separate written export licensing first.</li></ul><a href="https://developers.google.com/maps/documentation/places/web-service/policies" target="_blank" rel="noreferrer">Review official Places policy <ExternalLink size={13} /></a></article>
              <article className="access-card access-limited"><div className="access-top"><span className="access-logo meta-logo">M</span><span className="access-status status-approval">Approval needed</span></div><h3>Meta Ad Library API</h3><p>Potential future connector only after account/app access and authorization. Coverage is limited by geography, ad type, dates, fields and current terms.</p><ul><li>No documented city-level search for ordinary commercial ads.</li><li>Keep tokens server-side if a permitted integration is added.</li></ul><a href="https://www.facebook.com/ads/library/api/" target="_blank" rel="noreferrer">Check access requirements <ExternalLink size={13} /></a></article>
              <article className="access-card access-provider"><div className="access-top"><span className="access-logo provider-logo"><Database size={17} /></span><span className="access-status status-review">License review</span></div><h3>Exportable business data</h3><p>Choose a provider whose written license covers storage, derived matching and CSV/Sheets export. Verify field-level rights and retention before use.</p><ul><li>Open data may have attribution or share-alike obligations.</li><li>Vendor extraction capability does not grant rights in upstream data.</li></ul><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Review OSM license terms <ExternalLink size={13} /></a></article>
            </div>
            <section className="local-controls-panel"><div className="local-controls-icon"><LockKeyhole size={17} /></div><div><strong>Browser-local data</strong><span>Records are stored in this browser profile's IndexedDB database (with a localStorage fallback). They are not encrypted. Clear this workspace when finished or when using a shared device.</span></div><button className="button button-danger-quiet" onClick={clearLocalData}><Trash2 size={14} />Clear local workspace</button></section>
            <div className="setup-link-row"><FileText size={16} /><span>Need help getting access or selecting a source?</span><a href="./docs/API_ACCESS_AND_DATA_RIGHTS.md" target="_blank" rel="noreferrer">Open API and data-rights guide <ArrowUpRight size={14} /></a></div>
          </>}
        </section>
        <footer className="app-footer"><span>LocalScope · Local research workspace</span><span><span className="local-status-dot" /> No external data collection</span><a href="./docs/API_ACCESS_AND_DATA_RIGHTS.md" target="_blank" rel="noreferrer">API setup guide <ArrowUpRight size={12} /></a></footer>
      </main>

      {selectedRecord && <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedRecord(null)}><aside className="record-drawer" role="dialog" aria-modal="true"><div className="drawer-head"><div><span className="eyebrow">SOURCE RECORD</span><h2>{selectedRecord.name}</h2></div><button className="icon-button" onClick={() => setSelectedRecord(null)} aria-label="Close record"><X size={18} /></button></div><SourceTag record={selectedRecord} /><div className="drawer-fields">{Object.entries(selectedRecord).filter(([key, value]) => !['id', 'kind', 'raw', 'socialLinks'].includes(key) && value !== '' && value !== null && value !== undefined).map(([key, value]) => <div className="drawer-field" key={key}><span>{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`).replace(/^./, (letter) => letter.toUpperCase())}</span><strong>{String(value)}</strong></div>)}{selectedRecord.socialLinks?.length > 0 && <div className="drawer-field"><span>Social links</span><strong>{selectedRecord.socialLinks.join(' · ')}</strong></div>}</div><div className="drawer-permission"><ShieldCheck size={16} /><div><strong>{isExportable(selectedRecord) ? 'Export marked permitted' : 'Export restricted'}</strong><span>Source: {selectedRecord.sourceName || 'Not supplied'} · {selectedRecord.licenseLabel || 'License not specified'}</span><small>{selectedRecord.rightsNote || 'No rights note supplied'}</small></div></div><div className="drawer-note"><CircleAlert size={15} /><span>Imported fields are source-reported and have not been independently verified.</span></div><button className="button button-secondary drawer-close" onClick={() => setSelectedRecord(null)}>Close</button></aside></div>}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={handleImport} initialKind={importKind} />
      {toast && <div className="toast-message" role="status"><CheckCircle2 size={16} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss message"><X size={14} /></button></div>}
    </div>
  );
}
