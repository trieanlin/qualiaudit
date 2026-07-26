import { ArrowRight, Check, CircleAlert, Download, FileSpreadsheet, Info, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { SAMPLE_NOTICE } from '../data/sample'
import { DelimitedTextError, parseDelimitedText } from '../lib/csv'
import type { MappedImportRow, SpreadsheetImportKind } from '../lib/spreadsheet'
import { validateCodebook, validateExcerpts } from '../lib/validation'
import type { CodeDefinition, Confidence, HumanCodedExcerpt } from '../types'
import { SpreadsheetImportDialog } from './SpreadsheetImportDialog'

interface MaterialsProps {
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  onChangeCodebook: (rows: CodeDefinition[]) => void
  onChangeExcerpts: (rows: HumanCodedExcerpt[]) => void
  onContinue: () => void
  locked?: boolean
}

const MAX_TEXT_IMPORT_BYTES = 10 * 1024 * 1024

interface ImportMessage {
  kind: 'success' | 'error'
  text: string
}

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function confidence(value: string): Confidence | undefined {
  const normalized = value.trim().toLowerCase()
  return normalized === 'low' || normalized === 'medium' || normalized === 'high' ? normalized : undefined
}

function codebookRows(rows: MappedImportRow[]): CodeDefinition[] {
  return rows.map((row) => ({
    code: row.code ?? '',
    definition: row.definition ?? '',
    include_when: row.include_when ?? '',
    exclude_when: row.exclude_when ?? '',
    ...(row.example ? { example: row.example } : {}),
  }))
}

function excerptRows(rows: MappedImportRow[]): HumanCodedExcerpt[] {
  return rows.map((row) => ({
    excerpt_id: row.excerpt_id ?? '',
    source_id: row.source_id ?? '',
    excerpt: row.excerpt ?? '',
    context: row.context || undefined,
    human_code: row.human_code ?? '',
    human_rationale: row.human_rationale || undefined,
    human_confidence: confidence(row.human_confidence ?? ''),
    second_coder_code: row.second_coder_code || undefined,
    second_coder_rationale: row.second_coder_rationale || undefined,
  }))
}

export function Materials({ codebook, excerpts, onChangeCodebook, onChangeExcerpts, onContinue, locked = false }: MaterialsProps) {
  const [tab, setTab] = useState<'codebook' | 'coding'>('codebook')
  const [importMessage, setImportMessage] = useState<ImportMessage | null>(null)
  const [spreadsheetImport, setSpreadsheetImport] = useState<{ file: File; kind: SpreadsheetImportKind; sample?: boolean } | null>(null)
  const codebookInput = useRef<HTMLInputElement>(null)
  const excerptsInput = useRef<HTMLInputElement>(null)
  const codebookTab = useRef<HTMLButtonElement>(null)
  const codingTab = useRef<HTMLButtonElement>(null)
  const codebookIssues = useMemo(() => validateCodebook(codebook), [codebook])
  const excerptIssues = useMemo(() => validateExcerpts(excerpts, codebook), [excerpts, codebook])
  const errors = [...codebookIssues, ...excerptIssues].filter((issue) => issue.level === 'error')
  const warnings = [...codebookIssues, ...excerptIssues].filter((issue) => issue.level === 'warning')
  const ready = codebook.length > 0 && excerpts.length > 0 && errors.length === 0

  const handleTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    current: 'codebook' | 'coding',
  ) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'ArrowLeft' || event.key === 'Home'
      ? 'codebook'
      : event.key === 'ArrowRight' || event.key === 'End'
        ? 'coding'
        : current
    setTab(next)
    const nextTabRef = next === 'codebook' ? codebookTab : codingTab
    nextTabRef.current?.focus()
  }

  const importCodebook = async (file?: File) => {
    if (!file) return
    if (file.name.toLowerCase().endsWith('.xlsx')) {
      setSpreadsheetImport({ file, kind: 'codebook' })
      return
    }
    try {
      if (file.size > MAX_TEXT_IMPORT_BYTES) throw new DelimitedTextError('Delimited-text imports are limited to 10 MB.')
      const parsed = parseDelimitedText(await readTextFile(file))
      const rows = codebookRows(parsed.rows)
      onChangeCodebook(rows)
      setImportMessage({
        kind: 'success',
        text: `Imported ${rows.length} codebook rows from ${file.name} (${parsed.delimiterLabel}-delimited).`,
      })
    } catch (error) {
      setImportMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'The selected text file could not be read.',
      })
    }
  }

  const importExcerpts = async (file?: File) => {
    if (!file) return
    if (file.name.toLowerCase().endsWith('.xlsx')) {
      setSpreadsheetImport({ file, kind: 'excerpts' })
      return
    }
    try {
      if (file.size > MAX_TEXT_IMPORT_BYTES) throw new DelimitedTextError('Delimited-text imports are limited to 10 MB.')
      const parsed = parseDelimitedText(await readTextFile(file))
      const rows = excerptRows(parsed.rows)
      onChangeExcerpts(rows)
      setImportMessage({
        kind: 'success',
        text: `Imported ${rows.length} coded excerpts from ${file.name} (${parsed.delimiterLabel}-delimited).`,
      })
    } catch (error) {
      setImportMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'The selected text file could not be read.',
      })
    }
  }

  const importSpreadsheetRows = (rows: MappedImportRow[], source: string) => {
    if (!spreadsheetImport) return
    if (spreadsheetImport.kind === 'codebook') {
      const importedRows = codebookRows(rows)
      onChangeCodebook(importedRows)
      setImportMessage({ kind: 'success', text: `Imported ${importedRows.length} codebook rows from ${source}.` })
    } else {
      const importedRows = excerptRows(rows)
      onChangeExcerpts(importedRows)
      setImportMessage({ kind: 'success', text: `Imported ${importedRows.length} coded excerpts from ${source}.` })
    }
    setSpreadsheetImport(null)
  }

  const openExcelSample = async () => {
    try {
      const response = await fetch('/samples/synthetic-qualiaudit-import.xlsx')
      if (!response.ok) throw new Error('Sample workbook unavailable')
      const file = new File([await response.blob()], 'synthetic-qualiaudit-import.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      setSpreadsheetImport({ file, kind: tab === 'codebook' ? 'codebook' : 'excerpts', sample: true })
    } catch {
      setImportMessage({ kind: 'error', text: 'The Excel sample could not be opened. You can still import a local CSV, TSV, or .xlsx file.' })
    }
  }

  const visibleIssues = tab === 'codebook' ? codebookIssues : excerptIssues

  return (
    <div className="page wide-page">
      <div className="page-heading row-heading">
        <div>
          <span className="overline">REVIEW MATERIALS</span>
          <h1>Inspect the record that will be frozen.</h1>
          <p>Check definitions and first-pass coding before the independent review begins.</p>
        </div>
        <div className={`validation-status ${ready ? 'ready' : 'attention'}`} role="status">
          {ready ? <Check size={18} /> : <CircleAlert size={18} />}
          <div><span>{ready ? 'Ready to freeze' : 'Needs attention'}</span><small>{errors.length} errors · {warnings.length} warnings</small></div>
        </div>
      </div>

      <div className="notice-bar"><Info size={17} /><strong>{SAMPLE_NOTICE}</strong><span>Replace it with a CSV, TSV, or .xlsx workbook when you are ready to test your own structure locally.</span></div>
      {locked && <div className="locked-notice"><span>Frozen record</span>These materials are read-only. They are the exact snapshot used for the independent review.</div>}

      <div className="material-tabs" role="tablist" aria-label="Review materials">
        <button
          ref={codebookTab}
          id="material-tab-codebook"
          type="button"
          role="tab"
          aria-selected={tab === 'codebook'}
          aria-controls="material-panel-codebook"
          tabIndex={tab === 'codebook' ? 0 : -1}
          className={tab === 'codebook' ? 'active' : ''}
          onClick={() => setTab('codebook')}
          onKeyDown={(event) => handleTabKeyDown(event, 'codebook')}
        >
          Codebook <span>{codebook.length}</span>
        </button>
        <button
          ref={codingTab}
          id="material-tab-coding"
          type="button"
          role="tab"
          aria-selected={tab === 'coding'}
          aria-controls="material-panel-coding"
          tabIndex={tab === 'coding' ? 0 : -1}
          className={tab === 'coding' ? 'active' : ''}
          onClick={() => setTab('coding')}
          onKeyDown={(event) => handleTabKeyDown(event, 'coding')}
        >
          Human-coded excerpts <span>{excerpts.length}</span>
        </button>
      </div>

      <section
        className="material-panel"
        id={`material-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`material-tab-${tab}`}
      >
        <div className="panel-toolbar">
          <div>
            <h2>{tab === 'codebook' ? 'Code definitions' : 'Human first-pass coding'}</h2>
            <p>{tab === 'codebook' ? 'Required fields are checked with explicit rules.' : 'At least one human code is required. A second coder is optional.'}</p>
          </div>
          <div className="toolbar-actions">
            <a className="button quiet" href={tab === 'codebook' ? '/samples/codebook-template.csv' : '/samples/coded-excerpts-template.csv'} download>
              <Download size={16} /> Template
            </a>
            <button className="button quiet compact" type="button" disabled={locked} onClick={() => void openExcelSample()}>
              <FileSpreadsheet size={16} /> Try Excel sample
            </button>
            <button className="button secondary compact" type="button" disabled={locked} onClick={() => (tab === 'codebook' ? codebookInput : excerptsInput).current?.click()}>
              <Upload size={16} /> Import CSV / TSV / Excel
            </button>
            <input ref={codebookInput} hidden type="file" accept=".csv,.tsv,.xlsx,text/csv,text/tab-separated-values,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => void importCodebook(event.target.files?.[0])} />
            <input ref={excerptsInput} hidden type="file" accept=".csv,.tsv,.xlsx,text/csv,text/tab-separated-values,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => void importExcerpts(event.target.files?.[0])} />
          </div>
        </div>

        {importMessage && <p className={`import-message ${importMessage.kind}`} role={importMessage.kind === 'error' ? 'alert' : 'status'}><FileSpreadsheet size={16} /> {importMessage.text}</p>}

        {tab === 'codebook' ? (
          <div className="table-scroll">
            <table className="data-table codebook-table">
              <caption className="sr-only">Frozen or imported codebook definitions</caption>
              <thead><tr><th scope="col">Code</th><th scope="col">Definition</th><th scope="col">Include when</th><th scope="col">Exclude when</th></tr></thead>
              <tbody>
                {codebook.map((row) => (
                  <tr key={row.code}>
                    <td><span className="code-pill">{row.code}</span></td>
                    <td>{row.definition}</td>
                    <td>{row.include_when}</td>
                    <td>{row.exclude_when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="excerpt-list compact-list">
            {excerpts.map((row) => (
              <article className="excerpt-row" key={row.excerpt_id}>
                <div className="excerpt-meta"><span>{row.excerpt_id}</span><span>{row.source_id}</span></div>
                <blockquote>“{row.excerpt}”</blockquote>
                <div className="coding-summary">
                  <span><small>HUMAN CODE</small><strong>{row.human_code}</strong></span>
                  <span><small>CONFIDENCE</small><strong className={`confidence ${row.human_confidence ?? 'unset'}`}>{row.human_confidence ?? 'not stated'}</strong></span>
                  {row.second_coder_code && <span><small>SECOND CODER</small><strong>{row.second_coder_code}</strong></span>}
                </div>
                {row.human_rationale && <p className="human-rationale">{row.human_rationale}</p>}
              </article>
            ))}
          </div>
        )}

        {visibleIssues.length > 0 && (
          <div className="issues-list" aria-live="polite">
            {visibleIssues.map((issue, index) => <p key={`${issue.row}-${issue.field}-${index}`} className={issue.level}><CircleAlert size={15} /> Row {issue.row}: {issue.message}</p>)}
          </div>
        )}
      </section>

      <div className="sticky-action-row">
        <div><strong>{codebook.length} codes · {excerpts.length} excerpts</strong><span>{locked ? 'Frozen snapshot used by the completed review.' : ready ? 'All required fields are present.' : 'Resolve validation errors before freezing.'}</span></div>
        <button className="button primary" type="button" onClick={onContinue} disabled={!ready}>{locked ? 'Return to review queue' : 'Prepare blind review'} <ArrowRight size={17} /></button>
      </div>

      {spreadsheetImport && (
        <SpreadsheetImportDialog
          file={spreadsheetImport.file}
          kind={spreadsheetImport.kind}
          downloadUrl={spreadsheetImport.sample ? '/samples/synthetic-qualiaudit-import.xlsx' : undefined}
          onClose={() => setSpreadsheetImport(null)}
          onImport={importSpreadsheetRows}
        />
      )}
    </div>
  )
}
