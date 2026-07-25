import { CircleAlert, FileSpreadsheet, LockKeyhole, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  detectImportProfile,
  getImportProfile,
  profilesForImport,
  type ImportProfile,
  type ImportProfileId,
} from '../lib/importProfiles'
import {
  fieldsForImport,
  guessColumnMapping,
  mapImportRows,
  missingRequiredMappings,
  readExcelWorkbook,
  suggestHeaderRow,
  tableFromSheet,
  type ColumnMapping,
  type MappedImportRow,
  type SpreadsheetImportKind,
  type WorkbookSheet,
} from '../lib/spreadsheet'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMPORT_ROWS = 5_000

interface SpreadsheetImportDialogProps {
  file: File
  kind: SpreadsheetImportKind
  downloadUrl?: string
  onClose: () => void
  onImport: (rows: MappedImportRow[], source: string) => void
}

function rowSummary(row: string[]): string {
  const values = row.filter(Boolean).slice(0, 3)
  return values.length > 0 ? values.join(' · ') : '(empty row)'
}

function suggestedMapping(headers: string[], kind: SpreadsheetImportKind, fields: ReturnType<typeof fieldsForImport>) {
  const profile = detectImportProfile(headers, kind)
  return {
    profile,
    mapping: guessColumnMapping(headers, fields, profile ?? undefined),
  }
}

export function SpreadsheetImportDialog({ file, kind, downloadUrl, onClose, onImport }: SpreadsheetImportDialogProps) {
  const fields = useMemo(() => fieldsForImport(kind), [kind])
  const availableProfiles = useMemo(() => profilesForImport(kind), [kind])
  const [sheets, setSheets] = useState<WorkbookSheet[]>([])
  const [sheetIndex, setSheetIndex] = useState(0)
  const [headerRowIndex, setHeaderRowIndex] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [profileId, setProfileId] = useState<'generic' | ImportProfileId>('generic')
  const [detectedProfileId, setDetectedProfileId] = useState<ImportProfileId | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (file.size > MAX_FILE_SIZE) {
        setError('This workbook is larger than 10 MB. Reduce it to the sheets and columns needed for review.')
        setLoading(false)
        return
      }

      try {
        const loadedSheets = await readExcelWorkbook(file)
        if (cancelled) return
        if (loadedSheets.length === 0) {
          setError('No readable worksheets were found in this workbook.')
          return
        }
        const preferredSheet = loadedSheets.findIndex((sheet) => {
          const name = sheet.name.toLowerCase()
          if (name === 'info' || name.includes('metadata')) return false
          return kind === 'codebook'
            ? name.includes('codebook') || name === 'codes' || name.includes('code list')
            : name.includes('excerpt') || name.includes('coding') || name.includes('quotation') || name.includes('segment')
        })
        const firstNonMetadataSheet = loadedSheets.findIndex((sheet) => {
          const name = sheet.name.toLowerCase()
          return name !== 'info' && !name.includes('metadata')
        })
        const initialSheetIndex = preferredSheet >= 0
          ? preferredSheet
          : firstNonMetadataSheet >= 0
            ? firstNonMetadataSheet
            : 0
        const initialHeaderRow = suggestHeaderRow(loadedSheets[initialSheetIndex], fields)
        const initialTable = tableFromSheet(loadedSheets[initialSheetIndex], initialHeaderRow)
        const suggestion = suggestedMapping(initialTable.headers, kind, fields)
        setSheets(loadedSheets)
        setSheetIndex(initialSheetIndex)
        setHeaderRowIndex(initialHeaderRow)
        setDetectedProfileId(suggestion.profile?.id ?? null)
        setProfileId(suggestion.profile?.id ?? 'generic')
        setMapping(suggestion.mapping)
      } catch {
        if (!cancelled) setError('This .xlsx file could not be read. Check that it is a valid, unencrypted Excel workbook.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [file, fields, kind])

  const sheet = sheets[sheetIndex]
  const table = useMemo(() => sheet ? tableFromSheet(sheet, headerRowIndex) : { headers: [], rows: [] }, [sheet, headerRowIndex])
  const selectedProfile = useMemo<ImportProfile | null>(() => (
    profileId === 'generic' ? null : getImportProfile(profileId)
  ), [profileId])
  const missingRequired = useMemo(() => missingRequiredMappings(mapping, fields), [mapping, fields])
  const tooManyRows = table.rows.length > MAX_IMPORT_ROWS
  const canImport = !loading && !error && table.rows.length > 0 && !tooManyRows && missingRequired.length === 0

  const chooseSheet = (nextIndex: number) => {
    const nextSheet = sheets[nextIndex]
    const nextHeaderRow = suggestHeaderRow(nextSheet, fields)
    const nextTable = tableFromSheet(nextSheet, nextHeaderRow)
    const suggestion = suggestedMapping(nextTable.headers, kind, fields)
    setSheetIndex(nextIndex)
    setHeaderRowIndex(nextHeaderRow)
    setDetectedProfileId(suggestion.profile?.id ?? null)
    setProfileId(suggestion.profile?.id ?? 'generic')
    setMapping(suggestion.mapping)
  }

  const chooseHeaderRow = (nextHeaderRow: number) => {
    const nextTable = tableFromSheet(sheet, nextHeaderRow)
    const suggestion = suggestedMapping(nextTable.headers, kind, fields)
    setHeaderRowIndex(nextHeaderRow)
    setDetectedProfileId(suggestion.profile?.id ?? null)
    setProfileId(suggestion.profile?.id ?? 'generic')
    setMapping(suggestion.mapping)
  }

  const chooseProfile = (nextProfileId: 'generic' | ImportProfileId) => {
    const nextProfile = nextProfileId === 'generic' ? undefined : getImportProfile(nextProfileId)
    setProfileId(nextProfileId)
    setMapping(guessColumnMapping(table.headers, fields, nextProfile))
  }

  const confirmImport = () => {
    if (!canImport || !sheet) return
    const profileSource = selectedProfile ? ` · ${selectedProfile.label}` : ''
    onImport(mapImportRows(table, mapping, fields), `${file.name} · ${sheet.name}${profileSource}`)
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="spreadsheet-dialog" role="dialog" aria-modal="true" aria-labelledby="spreadsheet-dialog-title">
        <header className="dialog-header">
          <div className="dialog-icon"><FileSpreadsheet size={20} /></div>
          <div>
            <span className="overline">LOCAL EXCEL IMPORT</span>
            <h2 id="spreadsheet-dialog-title">Map workbook columns before import.</h2>
            <p>{file.name}</p>
          </div>
          <button className="dialog-close" type="button" aria-label="Close Excel import" onClick={onClose}><X size={19} /></button>
        </header>

        {loading ? (
          <div className="dialog-loading" aria-live="polite"><span className="spinner" /> Reading workbook structure…</div>
        ) : error ? (
          <div className="dialog-error" role="alert"><CircleAlert size={18} /><span>{error}</span></div>
        ) : (
          <div className="dialog-body">
            <div className="excel-local-note"><LockKeyhole size={16} /><span><strong>Browser-local import.</strong> This workbook is read on this device and is not sent to a server or model provider.</span></div>

            <div className="import-controls">
              <label className="field">
                <span>Worksheet</span>
                <select value={sheetIndex} onChange={(event) => chooseSheet(Number(event.target.value))}>
                  {sheets.map((item, index) => <option value={index} key={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Header row</span>
                <select value={headerRowIndex} onChange={(event) => chooseHeaderRow(Number(event.target.value))}>
                  {sheet.rows.slice(0, 10).map((row, index) => <option value={index} key={`${index}-${rowSummary(row)}`}>Row {index + 1}: {rowSummary(row)}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Import profile</span>
                <select
                  value={profileId}
                  onChange={(event) => chooseProfile(event.target.value as 'generic' | ImportProfileId)}
                >
                  <option value="generic">Generic / manual mapping</option>
                  {availableProfiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.label}</option>)}
                </select>
              </label>
            </div>

            {selectedProfile && (
              <div className="profile-suggestion" aria-live="polite">
                <div>
                  <strong>{detectedProfileId === selectedProfile.id ? 'Suggested from column labels' : 'Selected mapping aid'} · {selectedProfile.label}</strong>
                  <span>{selectedProfile.description}</span>
                </div>
                <p>Confirm every mapping. QualiAudit reads this workbook only; it does not open {selectedProfile.tool} project files.</p>
              </div>
            )}

            <section className="mapping-section" aria-labelledby="mapping-heading">
              <div className="mapping-heading">
                <div><span className="overline">COLUMN MAPPING</span><h3 id="mapping-heading">Tell QualiAudit what each column means.</h3></div>
                <span>{table.rows.length} data rows</span>
              </div>
              <div className="mapping-grid">
                {fields.map((field) => (
                  <label className="mapping-field" key={field.key}>
                    <span>{field.label}{field.required && <b>Required</b>}</span>
                    <select
                      value={mapping[field.key] ?? ''}
                      onChange={(event) => setMapping((current) => ({
                        ...current,
                        [field.key]: event.target.value === '' ? '' : Number(event.target.value),
                      }))}
                    >
                      <option value="">Not mapped</option>
                      {table.headers.map((header, index) => <option value={index} key={`${index}-${header}`}>{header}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              {missingRequired.length > 0 && <p className="mapping-warning"><CircleAlert size={15} /> Map required fields: {missingRequired.map((field) => field.label).join(', ')}.</p>}
              {tooManyRows && <p className="mapping-warning"><CircleAlert size={15} /> This slice supports up to {MAX_IMPORT_ROWS.toLocaleString()} rows per sheet.</p>}
            </section>

            <section className="preview-section" aria-labelledby="preview-heading">
              <div className="mapping-heading"><div><span className="overline">PREVIEW</span><h3 id="preview-heading">Check the source before replacing current materials.</h3></div><span>First {Math.min(4, table.rows.length)} rows</span></div>
              <div className="table-scroll excel-preview">
                <table className="data-table">
                  <thead><tr>{table.headers.map((header, index) => <th key={`${index}-${header}`}>{header}</th>)}</tr></thead>
                  <tbody>
                    {table.rows.slice(0, 4).map((row, rowIndex) => (
                      <tr key={rowIndex}>{table.headers.map((_, columnIndex) => <td key={columnIndex}>{row[columnIndex]}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        <footer className="dialog-footer">
          <span>
            Importing replaces the current {kind === 'codebook' ? 'codebook' : 'human-coded excerpts'} before freezing.
            {downloadUrl && <> <a href={downloadUrl} download>Download this sample workbook</a>.</>}
          </span>
          <div>
            <button className="button quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="button" disabled={!canImport} onClick={confirmImport}>Import {table.rows.length || ''} rows</button>
          </div>
        </footer>
      </section>
    </div>
  )
}
