import { useMemo, useState } from 'react';
import { AlertTriangle, FileUp, LockKeyhole, X } from 'lucide-react';
import { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, detectDataKind, normalizeRows, parseImportText, sourceAuthorizationError } from '../lib/data.js';

const SOURCE_TYPES = [
  { value: 'user-file', label: 'User-supplied dataset' },
  { value: 'licensed-provider', label: 'Licensed data provider' },
  { value: 'open-data', label: 'Open-data source' },
  { value: 'meta', label: 'Meta data (authorized API / permission)' },
  { value: 'google-maps', label: 'Google Maps / Places (restricted)' },
  { value: 'manual', label: 'Manual research' },
  { value: 'other', label: 'Other' },
];

function suggestedFields(row, kind) {
  if (!row) return [];
  const fields = kind === 'business'
    ? ['Business Name', 'City', 'State', 'Country', 'Website', 'Email', 'Rating', 'Review Count']
    : ['Advertiser Name', 'Ad Text', 'Status', 'Country', 'City', 'Start Date', 'Library ID'];
  const keys = Object.keys(row);
  return fields.map((label) => {
    const needle = label.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = keys.find((item) => item.toLowerCase().replace(/[^a-z0-9]/g, '').includes(needle.split(/name|count/)[0]) && item);
    return key ? `${label}: ${String(row[key]).slice(0, 34)}` : null;
  }).filter(Boolean).slice(0, 4);
}

export default function ImportModal({ open, onClose, onImported, initialKind = 'business' }) {
  const [kind, setKind] = useState(initialKind);
  const [sourceType, setSourceType] = useState('user-file');
  const [sourceName, setSourceName] = useState('');
  const [licenseLabel, setLicenseLabel] = useState('');
  const [rightsNote, setRightsNote] = useState('');
  const [storageAllowed, setStorageAllowed] = useState(false);
  const [exportAllowed, setExportAllowed] = useState(false);
  const [explicitAuthorization, setExplicitAuthorization] = useState(false);
  const [explicitWrittenPermission, setExplicitWrittenPermission] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [rejectedCount, setRejectedCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [busy, setBusy] = useState(false);

  const source = useMemo(() => ({
    id: 'source-pending', name: sourceName.trim(), type: sourceType, licenseLabel: licenseLabel.trim(),
    rightsNote: rightsNote.trim(), storageAllowed, exportAllowed,
    explicitAuthorization, explicitWrittenPermission,
  }), [sourceName, sourceType, licenseLabel, rightsNote, storageAllowed, exportAllowed, explicitAuthorization, explicitWrittenPermission]);
  const permissionError = sourceAuthorizationError(source);
  const normalizedPreview = useMemo(() => rows.length ? normalizeRows(rows, kind, {
    ...source, id: 'source-preview', name: source.name || 'Preview source', importedAt: new Date().toISOString(),
  }) : { records: [], rejected: [], truncated: false }, [rows, kind, source]);

  if (!open) return null;

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setRows([]);
    setRejectedCount(0);
    setTruncated(false);
    if (file.size > MAX_IMPORT_BYTES) {
      setError(`File is larger than the ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB local import limit.`);
      return;
    }
    setBusy(true);
    try {
      const parsed = parseImportText(await file.text(), file.name);
      if (!parsed.length) throw new Error('No data rows were found. Check that the file has a header row and records.');
      const detected = detectDataKind(parsed, file.name);
      setKind(detected);
      setFileName(file.name);
      setRows(parsed.slice(0, MAX_IMPORT_ROWS + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this file.');
    } finally {
      setBusy(false);
    }
  };

  const commitImport = () => {
    setError('');
    if (!source.name) {
      setError('Give this source a recognizable name.');
      return;
    }
    if (permissionError) {
      setError(permissionError);
      return;
    }
    const importedAt = new Date().toISOString();
    const completeSource = {
      ...source,
      id: `source-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`,
      importedAt,
    };
    const result = normalizeRows(rows, kind, completeSource);
    if (!result.records.length) {
      setError('No valid records were found. Each row needs a business or advertiser name.');
      return;
    }
    onImported({ kind, source: completeSource, records: result.records, rejected: result.rejected, truncated: result.truncated || truncated, fileName });
    onClose();
  };

  const preview = normalizedPreview.records.slice(0, 4);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">LOCAL FILE IMPORT</span>
            <h2 id="import-title">Add research data</h2>
            <p>Preview the file and confirm its rights before records enter this browser workspace.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close import dialog"><X size={18} /></button>
        </header>

        <div className="modal-privacy"><LockKeyhole size={16} /><span>Files are read in this browser. This app does not upload them.</span></div>

        <div className="import-grid">
          <div className="import-column">
            <label className="field-label" htmlFor="record-kind">Record type</label>
            <select id="record-kind" value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="business">Businesses</option>
              <option value="ad">Ads / advertisers</option>
            </select>

            <label className="field-label" htmlFor="source-type">Source category</label>
            <select id="source-type" value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
              {SOURCE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>

            <label className="field-label" htmlFor="source-name">Source name</label>
            <input id="source-name" value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="e.g. Provider export — November" />

            <label className="field-label" htmlFor="license-name">License / permission label</label>
            <input id="license-name" value={licenseLabel} onChange={(event) => setLicenseLabel(event.target.value)} placeholder="e.g. Provider agreement, ODbL, user-owned file" />

            <label className="field-label" htmlFor="rights-note">Rights note or permission reference</label>
            <textarea id="rights-note" value={rightsNote} onChange={(event) => setRightsNote(event.target.value)} rows={3} placeholder="Note what the source permits: local storage, matching, CSV export, etc." />

            <div className="rights-checks">
              <label className="check-row">
                <input type="checkbox" checked={storageAllowed} onChange={(event) => setStorageAllowed(event.target.checked)} />
                <span>I am authorized to store and process this file in this local workspace.</span>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={exportAllowed} onChange={(event) => setExportAllowed(event.target.checked)} />
                <span>The source rights permit CSV export for my intended use.</span>
              </label>
              {sourceType === 'meta' && (
                <label className="check-row emphasis-check">
                  <input type="checkbox" checked={explicitAuthorization} onChange={(event) => setExplicitAuthorization(event.target.checked)} />
                  <span>I obtained this data through an authorized Meta API or have separate express permission for this use.</span>
                </label>
              )}
              {sourceType === 'google-maps' && (
                <label className="check-row emphasis-check">
                  <input type="checkbox" checked={explicitWrittenPermission} onChange={(event) => setExplicitWrittenPermission(event.target.checked)} />
                  <span>I have separate written Google permission covering storage and the specific use/export selected above.</span>
                </label>
              )}
            </div>

            {(sourceType === 'google-maps' || sourceType === 'meta') && (
              <div className="source-warning"><AlertTriangle size={15} /><span>{sourceType === 'google-maps'
                ? 'Standard Google Maps/Places terms do not allow this external listing export. The import remains blocked unless separate written permission covers this use.'
                : 'Meta records must come from an authorized API or other expressly permitted source. This checkbox is a self-attestation, not a verification.'}</span></div>
            )}
          </div>

          <div className="file-column">
            <div className={`dropzone ${rows.length ? 'has-file' : ''}`}>
              <input className="file-input" type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => handleFile(event.target.files?.[0])} aria-label="Choose a CSV or JSON file" />
              <div className="dropzone-icon"><FileUp size={22} /></div>
              <strong>{busy ? 'Reading file…' : rows.length ? fileName : 'Choose a CSV or JSON file'}</strong>
              <span>{rows.length ? `${rows.length.toLocaleString()} rows ready to preview` : 'Up to 15 MB · 10,000 records · no upload'}</span>
              <span className="button button-secondary button-small">Browse files</span>
            </div>

            {rows.length > 0 && (
              <div className="preview-card">
                <div className="preview-heading"><div><span className="eyebrow">PREVIEW</span><strong>{kind === 'business' ? 'Business records' : 'Ad records'}</strong></div><span className="preview-count">{normalizedPreview.records.length} valid</span></div>
                <div className="preview-table">
                  {preview.map((record) => (
                    <div className="preview-row" key={record.id}>
                      <div><strong>{record.name}</strong><span>{suggestedFields(record.raw, kind).slice(0, 2).join(' · ') || 'Name detected'}</span></div>
                      <span className="mini-source">{record.city || record.status || 'Ready'}</span>
                    </div>
                  ))}
                </div>
                {normalizedPreview.rejected.length > 0 && <p className="preview-note">{normalizedPreview.rejected.length} row(s) will be skipped because no business/advertiser name was found.</p>}
                {rows.length > MAX_IMPORT_ROWS && <p className="preview-note">Only the first {MAX_IMPORT_ROWS.toLocaleString()} rows will be imported.</p>}
              </div>
            )}
            <div className="column-hint"><strong>Common columns are mapped automatically.</strong><span>Keep your original file unchanged. Unrecognized columns are preserved with each record for review.</span></div>
          </div>
        </div>

        {error && <div className="form-error" role="alert"><AlertTriangle size={16} />{error}</div>}
        <footer className="modal-footer">
          <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="button" onClick={commitImport} disabled={!rows.length || busy}>
            Import {kind === 'business' ? 'businesses' : 'ads'}
          </button>
        </footer>
      </section>
    </div>
  );
}
