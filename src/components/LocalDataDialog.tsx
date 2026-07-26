import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { ReviewState } from '../hooks/useReviewState'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
import { formatStorageSize, summariseLocalData } from '../lib/localData'

interface LocalDataDialogProps {
  state: ReviewState
  onClose: () => void
  onSaveProject: () => void
  onClear: () => void
}

export function LocalDataDialog({ state, onClose, onSaveProject, onClear }: LocalDataDialogProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const { dialogRef, onDialogKeyDown } = useDialogAccessibility(onClose, deleted ? 'deleted' : 'inventory')
  const summary = summariseLocalData(state)

  const clearReview = () => {
    onClear()
    setDeleted(true)
    setConfirming(false)
  }

  if (deleted) {
    return (
      <div className="dialog-backdrop" role="presentation">
        <section
          ref={dialogRef}
          className="spreadsheet-dialog local-data-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="local-data-deleted-title"
          tabIndex={-1}
          onKeyDown={onDialogKeyDown}
        >
          <div className="local-data-success">
            <span className="success-symbol"><CheckCircle2 aria-hidden="true" /></span>
            <span className="overline">LOCAL DATA REMOVED</span>
            <h2 id="local-data-deleted-title">This browser no longer holds the review.</h2>
            <p>
              QualiAudit removed its own saved review record. Downloaded project files remain on your device
              until you delete them separately.
            </p>
            <button data-dialog-initial-focus className="button primary" type="button" onClick={onClose}>Return to QualiAudit</button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="spreadsheet-dialog local-data-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="local-data-title"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
      >
        <header className="dialog-header">
          <span className="dialog-icon"><ShieldCheck aria-hidden="true" /></span>
          <div>
            <span className="overline">LOCAL DATA &amp; PRIVACY</span>
            <h2 id="local-data-title">What this browser remembers</h2>
            <p>Inspect or remove QualiAudit’s saved review state without affecting other websites.</p>
          </div>
          <button data-dialog-initial-focus className="dialog-close" type="button" onClick={onClose} aria-label="Close local data dialog">
            <X size={17} />
          </button>
        </header>

        <div className="dialog-body local-data-body">
          <div className="local-storage-note">
            <Database size={19} aria-hidden="true" />
            <div>
              <strong>{summary.hasReview ? 'One review is saved in this browser' : 'No review is saved in this browser'}</strong>
              <p>
                {summary.hasReview
                  ? 'QualiAudit automatically keeps the current working state in this browser profile so a refresh does not erase your progress.'
                  : 'QualiAudit has no active project record in its browser storage.'}
              </p>
            </div>
            <span>{summary.hasReview ? formatStorageSize(summary.approximateBytes) : '0 B'}</span>
          </div>

          {summary.hasReview && (
            <section className="local-review-summary" aria-labelledby="saved-review-title">
              <div>
                <span className="overline">SAVED REVIEW</span>
                <h3 id="saved-review-title">{summary.projectName}</h3>
                <p>{summary.stage} · {summary.frozen ? 'Human first pass frozen' : 'Human first pass not frozen'}</p>
              </div>
              <dl>
                <div><dt>Codes</dt><dd>{summary.codeCount}</dd></div>
                <div><dt>Excerpts</dt><dd>{summary.excerptCount}</dd></div>
                <div><dt>AI reviews</dt><dd>{summary.reviewCount}</dd></div>
                <div><dt>Decisions</dt><dd>{summary.decisionCount}</dd></div>
                <div><dt>Reflexive memos</dt><dd>{summary.memoCount}</dd></div>
                <div><dt>Codebook changes</dt><dd>{summary.codebookChangeCount}</dd></div>
              </dl>
            </section>
          )}

          <section className="local-data-inventory" aria-labelledby="local-data-inventory-title">
            <div className="section-miniheading">
              <div>
                <span className="overline">DATA BOUNDARY</span>
                <h3 id="local-data-inventory-title">The saved record can include</h3>
              </div>
            </div>
            <div className="inventory-grid">
              <article><FileText /><strong>Research materials</strong><p>Project brief, codebook, excerpts and context.</p></article>
              <article><LockKeyhole /><strong>Human judgments</strong><p>Codes, rationales, confidence and the frozen first pass.</p></article>
              <article><ShieldCheck /><strong>Review record</strong><p>AI readings, uncertainty, decisions, reflexive memos and codebook-change history.</p></article>
            </div>
          </section>

          <div className="local-data-caution">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>Local does not mean encrypted.</strong>
              <p>
                Anyone or any software with access to this browser profile may be able to read the saved record.
                QualiAudit v0.1 is not suitable for sensitive, identifiable or regulated research data.
              </p>
            </div>
          </div>

          {confirming && (
            <div className="delete-confirmation" role="alert">
              <Trash2 size={18} aria-hidden="true" />
              <div>
                <strong>Delete this browser’s review record?</strong>
                <p>This cannot be undone here. Save a project file first if you may need the review later.</p>
              </div>
            </div>
          )}
        </div>

        <footer className="dialog-footer local-data-footer">
          <span>
            Deletion removes only QualiAudit’s browser record. It does not delete files you already downloaded.
          </span>
          <div>
            {summary.hasReview && !confirming && (
              <button className="button secondary compact" type="button" onClick={onSaveProject}>
                <Download size={15} /> Save backup
              </button>
            )}
            {summary.hasReview && (
              confirming ? (
                <>
                  <button className="button quiet compact" type="button" onClick={() => setConfirming(false)}>Cancel</button>
                  <button className="button danger compact" type="button" onClick={clearReview}>Yes, delete local review</button>
                </>
              ) : (
                <button className="button danger-outline compact" type="button" onClick={() => setConfirming(true)}>
                  <Trash2 size={15} /> Delete local review
                </button>
              )
            )}
            {!summary.hasReview && (
              <button className="button primary compact" type="button" onClick={onClose}>Close</button>
            )}
          </div>
        </footer>
      </section>
    </div>
  )
}
