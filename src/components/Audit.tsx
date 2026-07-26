import { useState } from 'react'
import { ArrowLeft, Check, Download, FileDown, FileJson, FileText, History, Info, LockKeyhole, ShieldCheck } from 'lucide-react'
import { buildAuditBundle, buildReviewedRows, downloadText, reviewedRowsCsv } from '../lib/export'
import { buildAuditMethodStatement, buildHtmlAuditReport, htmlAuditReportFilename } from '../lib/htmlReport'
import { categoryLabel, classifyCase } from '../lib/queue'
import { decisionLabels } from '../lib/resolutions'
import type {
  AiReview,
  CodebookChange,
  CodeDefinition,
  FrozenSnapshot,
  HumanCodedExcerpt,
  ProjectBrief,
  Resolution,
} from '../types'
import { ModeBadge } from './Shell'

interface AuditProps {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  frozen: FrozenSnapshot
  reviews: AiReview[]
  resolutions: Resolution[]
  codebookChanges: CodebookChange[]
  onBack: () => void
  onOpenCase: (excerptId: string) => void
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function Audit({
  project,
  codebook,
  excerpts,
  frozen,
  reviews,
  resolutions,
  codebookChanges,
  onBack,
  onOpenCase,
}: AuditProps) {
  const [reportOptionsOpen, setReportOptionsOpen] = useState(false)
  const [includeSourceText, setIncludeSourceText] = useState(false)
  const changed = resolutions.filter((item) => item.changed_after_ai_exposure)
  const unresolved = resolutions.filter((item) => item.decision === 'unresolved')
  const unresolvedRecodingCount = codebookChanges.reduce(
    (total, item) => total + item.unresolved_recode_excerpt_ids.length,
    0,
  )
  const rows = buildReviewedRows(excerpts, reviews, resolutions)
  const bundle = buildAuditBundle({
    project,
    codebook,
    excerpts,
    frozen,
    reviews,
    resolutions,
    codebookChanges,
  })
  const reviewDate = reviews[0]?.reviewed_at
  const reviewer = reviews[0]
  const usedOpenAi = reviewer?.provider === 'openai'
  const reviewerLabel = usedOpenAi
    ? `${reviewer.model ?? 'configured model'} via OpenAI API`
    : reviewer?.model ?? reviewer?.reviewer ?? 'not run'
  const promptVersion = reviewer?.prompt_version ?? (usedOpenAi ? 'not recorded' : 'mock-rules-v0.1')
  const schemaVersion = reviewer?.schema_version ?? (usedOpenAi ? 'not recorded' : 'mock-review-output-v0.1')
  const dataDestination = usedOpenAi ? 'OpenAI API via server endpoint' : 'Local browser only'
  const methodStatement = buildAuditMethodStatement(project, excerpts.length, reviewer)
  const downloadHtmlReport = () => {
    downloadText(
      htmlAuditReportFilename(project),
      buildHtmlAuditReport({
        project,
        codebook,
        excerpts,
        frozen,
        reviews,
        resolutions,
        codebookChanges,
      }, {
        includeSourceText,
      }),
      'text/html;charset=utf-8',
    )
  }

  return (
    <div className="page wide-page audit-page">
      <button className="text-button back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to review queue</button>
      <div className="page-heading row-heading audit-heading">
        <div>
          <div className="heading-badges"><span className="overline">AUDIT SUMMARY</span><ModeBadge mode={project.analysisMode} /></div>
          <h1>Trace the interpretation, not just the output.</h1>
          <p>An auditable record of what was reviewed, what changed, and where the human decision remained.</p>
        </div>
        <div className="export-group">
          <button className="button secondary" type="button" onClick={() => downloadText('qualiaudit-reviewed-coding.csv', reviewedRowsCsv(rows), 'text/csv;charset=utf-8')}><Download size={16} /> CSV</button>
          <button className="button secondary" type="button" onClick={() => downloadText('qualiaudit-audit.json', JSON.stringify(bundle, null, 2), 'application/json')}><FileJson size={16} /> Audit JSON</button>
          <button
            className="button primary"
            type="button"
            aria-expanded={reportOptionsOpen}
            aria-controls="html-report-options"
            onClick={() => setReportOptionsOpen((open) => !open)}
          >
            <FileDown size={16} /> HTML report
          </button>
        </div>
      </div>

      {reportOptionsOpen && (
        <section className="report-export-panel" id="html-report-options" aria-labelledby="html-report-heading">
          <div>
            <span className="overline">PRINTABLE AUDIT REPORT</span>
            <h2 id="html-report-heading">Choose whether source text belongs in this copy.</h2>
            <p>The downloaded file is self-contained, contains no scripts, and makes no network requests. Open it in a browser and use Print to save a PDF.</p>
          </div>
          <fieldset>
            <legend>Quoted source material</legend>
            <label>
              <input
                type="radio"
                name="html-report-source-text"
                aria-label="Omit excerpt and evidence text"
                checked={!includeSourceText}
                onChange={() => setIncludeSourceText(false)}
              />
              <span><strong>Omit excerpt and evidence text <em>Recommended</em></strong><small>IDs, codes, decisions, and rationales remain. Review them for sensitive details before sharing.</small></span>
            </label>
            <label>
              <input
                type="radio"
                name="html-report-source-text"
                aria-label="Include full source text"
                checked={includeSourceText}
                onChange={() => setIncludeSourceText(true)}
              />
              <span><strong>Include full source text</strong><small>Adds excerpts, context, and AI evidence quotes. Govern the report like the underlying research data.</small></span>
            </label>
          </fieldset>
          <div className="report-export-action">
            <span>{includeSourceText ? 'Full analytic record · contains quoted source data' : 'Privacy-minimised copy · source quotes omitted'}</span>
            <button className="button primary" type="button" onClick={downloadHtmlReport}><Download size={16} /> Download HTML report</button>
          </div>
        </section>
      )}

      <div className="audit-metrics">
        <article><span><Check /></span><div><strong>{resolutions.length}</strong><small>cases resolved</small></div></article>
        <article><span><History /></span><div><strong>{changed.length}</strong><small>changed after AI exposure</small></div></article>
        <article><span><Info /></span><div><strong>{unresolved.length}</strong><small>intentionally unresolved</small></div></article>
        <article><span><FileText /></span><div><strong>{codebookChanges.length}</strong><small>codebook change events</small></div></article>
      </div>

      <div className="audit-grid">
        <section className="audit-card provenance-card">
          <div className="card-heading"><LockKeyhole /><div><span className="overline">REVIEW PROVENANCE</span><h2>What happened, and when</h2></div></div>
          <dl className="provenance-list">
            <div><dt>Human interpretation frozen</dt><dd>{formatDate(frozen.frozenAt)}</dd></div>
            <div><dt>Reviewer</dt><dd>{reviewerLabel}</dd></div>
            <div><dt>Prompt / rules version</dt><dd>{promptVersion}</dd></div>
            <div><dt>Output schema version</dt><dd>{schemaVersion}</dd></div>
            <div><dt>Independent review run</dt><dd>{reviewDate ? formatDate(reviewDate) : 'Not recorded'}</dd></div>
            <div><dt>Data destination</dt><dd>{dataDestination}</dd></div>
            {usedOpenAi && <div><dt>Transmission consent</dt><dd>{reviewer?.consent_version ?? 'Not recorded'}</dd></div>}
            {usedOpenAi && reviewer?.request_id && <div><dt>Client request ID</dt><dd><code>{reviewer.request_id}</code></dd></div>}
            {usedOpenAi && reviewer?.provider_request_id && <div><dt>Provider request ID</dt><dd><code>{reviewer.provider_request_id}</code></dd></div>}
            {usedOpenAi && reviewer?.provider_response_id && <div><dt>Provider response ID</dt><dd><code>{reviewer.provider_response_id}</code></dd></div>}
          </dl>
          <div className="withheld-proof"><ShieldCheck /><p><strong>Blind-review boundary recorded</strong>Human codes, rationales, confidence, second-coder decisions, and final conclusions were withheld.</p></div>
        </section>

        <section className="audit-card statement-card">
          <div className="card-heading"><FileText /><div><span className="overline">DRAFT AI-USE STATEMENT</span><h2>Methods language to adapt</h2></div></div>
          <blockquote>{methodStatement}</blockquote>
          <button className="text-button" type="button" onClick={() => void navigator.clipboard?.writeText(methodStatement)}>Copy draft statement</button>
          <small>Review and adapt this statement for your actual method, model, data governance, and institutional requirements.</small>
        </section>
      </div>

      <section className="codebook-ledger-section">
        <div className="section-miniheading">
          <div><span className="overline">CODEBOOK CHANGE LEDGER</span><h2>Proposed revisions after comparison</h2></div>
          <span>{codebookChanges.length} events · {unresolvedRecodingCount} unresolved recoding tasks</span>
        </div>
        {codebookChanges.length === 0 ? (
          <div className="empty-log">
            <FileText />
            <h3>No codebook changes recorded.</h3>
            <p>A “Revise codebook” decision can preserve before/after guidance without altering the frozen snapshot.</p>
          </div>
        ) : (
          <div className="codebook-ledger">
            {codebookChanges.map((change) => (
              <article key={change.id}>
                <div className="ledger-topline">
                  <span className="code-pill">{change.code}</span>
                  <span>{formatDate(change.created_at)}</span>
                </div>
                <h3>Proposed by {change.author}</h3>
                <p className="ledger-rationale">{change.rationale}</p>
                <div className="ledger-comparison">
                  <section>
                    <span className="overline">FROZEN BEFORE</span>
                    <p>{change.before.definition}</p>
                    <dl><dt>Include when</dt><dd>{change.before.include_when}</dd><dt>Exclude when</dt><dd>{change.before.exclude_when}</dd></dl>
                  </section>
                  <section>
                    <span className="overline">PROPOSED AFTER</span>
                    <p>{change.after.definition}</p>
                    <dl><dt>Include when</dt><dd>{change.after.include_when}</dd><dt>Exclude when</dt><dd>{change.after.exclude_when}</dd></dl>
                  </section>
                </div>
                <div className="ledger-work">
                  <div><strong>Affected excerpts</strong><span>{change.affected_excerpt_ids.join(', ')}</span></div>
                  <div><strong>Unresolved recoding</strong><span>{change.unresolved_recode_excerpt_ids.join(', ') || 'None'}</span></div>
                  <button className="text-button" type="button" onClick={() => onOpenCase(change.trigger_excerpt_id)}>Open triggering case</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="decision-log-section">
        <div className="section-miniheading"><div><span className="overline">DECISION LOG</span><h2>Post-exposure decisions</h2></div><span>{resolutions.length} of {excerpts.length} cases recorded</span></div>
        {resolutions.length === 0 ? (
          <div className="empty-log"><History /><h3>No decisions recorded yet.</h3><p>Return to the queue and resolve a case to begin the audit log.</p><button className="button secondary" type="button" onClick={onBack}>Open review queue</button></div>
        ) : (
          <div className="decision-log">
            {resolutions.map((resolution) => {
              const human = excerpts.find((item) => item.excerpt_id === resolution.excerpt_id)
              const ai = reviews.find((item) => item.excerpt_id === resolution.excerpt_id)
              if (!human || !ai) return null
              const category = classifyCase(human, ai, codebook)
              return (
                <article key={resolution.excerpt_id}>
                  <div className="log-timeline"><span><Check /></span><i /></div>
                  <div className="log-content">
                    <div className="log-topline"><span className={`category-badge category-${category}`}>{categoryLabel(category, project.analysisMode)}</span><span>{formatDate(resolution.decided_at)}</span></div>
                    <h3>{resolution.excerpt_id} · {decisionLabels[resolution.decision]}</h3>
                    <p>{resolution.rationale}</p>
                    <div className="log-codes"><span>Human <b>{human.human_code}</b></span><span>AI <b>{ai.primary_suggested_code}</b></span><span>Final <b>{resolution.final_code}</b></span>{resolution.changed_after_ai_exposure && <em>Changed after exposure</em>}</div>
                    <button className="text-button" type="button" onClick={() => onOpenCase(resolution.excerpt_id)}>Open case</button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="limitations-note">
        <Info />
        <div>
          <strong>Interpret this report with care.</strong>
          <p>
            {usedOpenAi
              ? 'The model reading does not validate qualitative findings, replace a second human coder, or establish correctness. Check provider output, governance, and the recorded evidence before drawing conclusions.'
              : 'The mock reviewer is deterministic and keyword-oriented. It does not validate qualitative findings, replace a second human coder, or establish correctness. This synthetic review demonstrates workflow and auditability only.'}
          </p>
        </div>
      </section>
    </div>
  )
}
