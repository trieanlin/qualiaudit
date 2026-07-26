import { ArchiveRestore, CircleAlert, FileJson2, LockKeyhole, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
import {
  MAX_PROJECT_FILE_SIZE,
  parsePortableProjectFile,
  ProjectFileError,
  type PortableProjectFile,
} from '../lib/projectFile'
import type { ReviewState } from '../hooks/useReviewState'

interface ProjectFileImportDialogProps {
  file: File
  onClose: () => void
  onRestore: (state: ReviewState) => void
}

function reviewStage(file: PortableProjectFile): string {
  const { frozen, reviews, resolutions, reflexiveMemos, codebookChanges } = file.state
  if (resolutions.length > 0) {
    const changeLabel = codebookChanges.length > 0
      ? ` · ${codebookChanges.length} codebook change${codebookChanges.length === 1 ? '' : 's'}`
      : ''
    const memoLabel = reflexiveMemos.length > 0
      ? ` · ${reflexiveMemos.length} reflexive memo${reflexiveMemos.length === 1 ? '' : 's'}`
      : ''
    return `${resolutions.length} decision${resolutions.length === 1 ? '' : 's'} recorded${memoLabel}${changeLabel}`
  }
  if (reviews.length > 0) return 'Independent review complete'
  if (frozen) return 'Human interpretation frozen'
  return 'Review materials in progress'
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ProjectFileImportDialog({ file, onClose, onRestore }: ProjectFileImportDialogProps) {
  const [projectFile, setProjectFile] = useState<PortableProjectFile | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { dialogRef, onDialogKeyDown } = useDialogAccessibility(onClose)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (file.size > MAX_PROJECT_FILE_SIZE) {
        setError('This project file is larger than 20 MB. QualiAudit did not open it.')
        setLoading(false)
        return
      }
      try {
        const parsed = parsePortableProjectFile(await file.text())
        if (!cancelled) setProjectFile(parsed)
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof ProjectFileError ? reason.message : 'This project file could not be read.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [file])

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="spreadsheet-dialog project-file-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-file-dialog-title"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
      >
        <header className="dialog-header">
          <div className="dialog-icon"><FileJson2 size={20} /></div>
          <div>
            <span className="overline">LOCAL PROJECT FILE</span>
            <h2 id="project-file-dialog-title">Check this review before restoring it.</h2>
            <p>{file.name}</p>
          </div>
          <button data-dialog-initial-focus className="dialog-close" type="button" aria-label="Close project import" onClick={onClose}><X size={19} /></button>
        </header>

        {loading ? (
          <div className="dialog-loading" aria-live="polite"><span className="spinner" /> Reading project structure…</div>
        ) : error ? (
          <div className="project-file-error">
            <div className="dialog-error" role="alert"><CircleAlert size={18} /><span>{error}</span></div>
            <p>No locally saved review has been changed.</p>
          </div>
        ) : projectFile && (
          <div className="dialog-body project-file-body">
            <div className="excel-local-note"><LockKeyhole size={16} /><span><strong>Browser-local restore.</strong> This file is read on this device and is not sent to a server or model provider.</span></div>

            <section className="restore-summary" aria-label="Saved project summary">
              <div className="restore-title">
                <span className="overline">SAVED REVIEW</span>
                <h3>{projectFile.state.project?.name}</h3>
                <p>{projectFile.state.project?.researchQuestion}</p>
              </div>
              <dl>
                <div><dt>Analysis approach</dt><dd>{projectFile.state.project?.analysisMode === 'reflexive' ? 'Reflexive thematic analysis' : 'Codebook / framework analysis'}</dd></div>
                <div><dt>Saved stage</dt><dd>{reviewStage(projectFile)}</dd></div>
                <div><dt>Materials</dt><dd>{projectFile.state.codebook.length} codes · {projectFile.state.excerpts.length} excerpts</dd></div>
                <div><dt>Exported</dt><dd>{formatDate(projectFile.exported_at)}</dd></div>
              </dl>
            </section>

            <div className="project-file-caution">
              <CircleAlert size={17} />
              <div>
                <strong>A project file contains the full research record.</strong>
                <p>It may include original excerpts, context, human and second-coder judgments, AI reviews, rationales, decisions, reflexive memos, and codebook-change history. Store and share it according to your research-data governance requirements.</p>
              </div>
            </div>
          </div>
        )}

        <footer className="dialog-footer">
          <span>Restoring replaces the review currently saved in this browser.</span>
          <div>
            <button className="button quiet" type="button" onClick={onClose}>Cancel</button>
            <button
              className="button primary"
              type="button"
              disabled={!projectFile}
              onClick={() => projectFile && onRestore(projectFile.state)}
            >
              <ArchiveRestore size={16} /> Restore project
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
