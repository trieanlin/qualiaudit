import { ArrowLeft, Check, Download, FileJson, FileText, History, Info, LockKeyhole, ShieldCheck } from 'lucide-react'
import { buildAuditBundle, buildReviewedRows, downloadText, reviewedRowsCsv } from '../lib/export'
import { categoryLabel, classifyCase } from '../lib/queue'
import { decisionLabels } from '../lib/resolutions'
import type { AiReview, CodeDefinition, FrozenSnapshot, HumanCodedExcerpt, ProjectBrief, Resolution } from '../types'
import { ModeBadge } from './Shell'

interface AuditProps {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  frozen: FrozenSnapshot
  reviews: AiReview[]
  resolutions: Resolution[]
  onBack: () => void
  onOpenCase: (excerptId: string) => void
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function Audit({ project, codebook, excerpts, frozen, reviews, resolutions, onBack, onOpenCase }: AuditProps) {
  const changed = resolutions.filter((item) => item.changed_after_ai_exposure)
  const unresolved = resolutions.filter((item) => item.decision === 'unresolved')
  const codebookChanges = resolutions.filter((item) => item.decision === 'revise_codebook')
  const rows = buildReviewedRows(excerpts, reviews, resolutions)
  const bundle = buildAuditBundle({ project, codebook, excerpts, frozen, reviews, resolutions })
  const reviewDate = reviews[0]?.reviewed_at
  const methodStatement = project.analysisMode === 'reflexive'
    ? `We used QualiAudit to support reflexive engagement with an independently generated AI reading of ${excerpts.length} fictional coded excerpts. Human first-pass interpretations were frozen before review and withheld from the deterministic mock reviewer. Divergence was treated as a prompt for reflexivity rather than an error or accuracy measure. Researchers retained final interpretive authority and documented post-exposure decisions in an audit log.`
    : `We used QualiAudit to compare human first-pass coding with an independently generated AI reading of ${excerpts.length} fictional coded excerpts. Human codes and rationales were frozen and withheld from the deterministic mock reviewer. Descriptive overlap and divergence were used to prioritise human review, not as validation or intercoder reliability. Researchers retained final decision authority and documented post-exposure decisions in an audit log.`

  return (
    <div className="page wide-page audit-page">
      <button className="text-button back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to review queue</button>
      <div className="page-heading row-heading audit-heading">
        <div>
          <div className="heading-badges"><span className="overline">AUDIT SUMMARY</span><ModeBadge mode={project.analysisMode} /></div>
          <h1>Trace the interpretation, not just the output.</h1>
          <p>A portable record of what was reviewed, what changed, and where the human decision remained.</p>
        </div>
        <div className="export-group">
          <button className="button secondary" type="button" onClick={() => downloadText('qualiaudit-reviewed-coding.csv', reviewedRowsCsv(rows), 'text/csv;charset=utf-8')}><Download size={16} /> CSV</button>
          <button className="button primary" type="button" onClick={() => downloadText('qualiaudit-audit.json', JSON.stringify(bundle, null, 2), 'application/json')}><FileJson size={16} /> Export audit JSON</button>
        </div>
      </div>

      <div className="audit-metrics">
        <article><span><Check /></span><div><strong>{resolutions.length}</strong><small>cases resolved</small></div></article>
        <article><span><History /></span><div><strong>{changed.length}</strong><small>changed after AI exposure</small></div></article>
        <article><span><Info /></span><div><strong>{unresolved.length}</strong><small>intentionally unresolved</small></div></article>
        <article><span><FileText /></span><div><strong>{codebookChanges.length}</strong><small>codebook changes flagged</small></div></article>
      </div>

      <div className="audit-grid">
        <section className="audit-card provenance-card">
          <div className="card-heading"><LockKeyhole /><div><span className="overline">REVIEW PROVENANCE</span><h2>What happened, and when</h2></div></div>
          <dl className="provenance-list">
            <div><dt>Human interpretation frozen</dt><dd>{formatDate(frozen.frozenAt)}</dd></div>
            <div><dt>Reviewer</dt><dd>deterministic-mock-v0.1</dd></div>
            <div><dt>Prompt / rules version</dt><dd>mock-rules-v0.1</dd></div>
            <div><dt>Independent review run</dt><dd>{reviewDate ? formatDate(reviewDate) : 'Not recorded'}</dd></div>
            <div><dt>Data destination</dt><dd>Local browser only</dd></div>
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
        <div><strong>Interpret this report with care.</strong><p>The mock reviewer is deterministic and keyword-oriented. It does not validate qualitative findings, replace a second human coder, or establish correctness. This synthetic review demonstrates workflow and auditability only.</p></div>
      </section>
    </div>
  )
}
