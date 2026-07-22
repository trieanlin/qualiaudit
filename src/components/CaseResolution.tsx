import { ArrowLeft, ArrowRight, Check, CircleAlert, Eye, GitCompareArrows, MessageSquareText, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { categoryLabel, classifyCase } from '../lib/queue'
import { decisionLabels } from '../lib/resolutions'
import type {
  AiReview,
  CodeDefinition,
  HumanCodedExcerpt,
  ProjectBrief,
  Resolution,
  ResolutionDecision,
} from '../types'

interface CaseResolutionProps {
  project: ProjectBrief
  codebook: CodeDefinition[]
  human: HumanCodedExcerpt
  ai: AiReview
  existing?: Resolution
  onBack: () => void
  onSave: (resolution: Resolution) => void
}

const CHANGED_DECISIONS = new Set<ResolutionDecision>(['accept_ai', 'keep_both', 'revise_code', 'revise_boundary', 'revise_codebook'])

const decisionDescriptions: Record<ResolutionDecision, string> = {
  keep_original: 'The first-pass reading remains most useful.',
  accept_ai: 'Use the AI reading as the final code for this excerpt.',
  keep_both: 'Preserve the interpretive tension in the reviewed table.',
  revise_code: 'Choose a different code after considering the comparison.',
  revise_boundary: 'The analytic unit needs more or less surrounding text.',
  revise_codebook: 'The definitions or boundaries between codes need attention.',
  discuss: 'Take the case to a supervisor, co-researcher, or team meeting.',
  unresolved: 'Document the tension without forcing closure.',
  reject_ai: 'The suggested reading is not adequately supported by the excerpt.',
}

export function CaseResolution({ project, codebook, human, ai, existing, onBack, onSave }: CaseResolutionProps) {
  const [decision, setDecision] = useState<ResolutionDecision | null>(existing?.decision ?? null)
  const [rationale, setRationale] = useState(existing?.rationale ?? '')
  const [finalCode, setFinalCode] = useState(existing?.final_code ?? human.human_code)
  const [showError, setShowError] = useState(false)
  const category = classifyCase(human, ai, codebook)
  const relevantCodes = useMemo(() => {
    const wanted = new Set([human.human_code, ai.primary_suggested_code, ai.alternative_code].filter(Boolean))
    return codebook.filter((item) => wanted.has(item.code))
  }, [ai, codebook, human.human_code])

  const chooseDecision = (next: ResolutionDecision) => {
    setDecision(next)
    if (next === 'accept_ai') setFinalCode(ai.primary_suggested_code)
    else if (next === 'keep_both') setFinalCode(`${human.human_code} + ${ai.primary_suggested_code}`)
    else if (next !== 'revise_code') setFinalCode(human.human_code)
  }

  const save = () => {
    if (!decision || rationale.trim().length < 8) {
      setShowError(true)
      return
    }
    onSave({
      excerpt_id: human.excerpt_id,
      decision,
      rationale: rationale.trim(),
      final_code: finalCode,
      decided_at: new Date().toISOString(),
      changed_after_ai_exposure: CHANGED_DECISIONS.has(decision),
    })
  }

  return (
    <div className="page wide-page case-page">
      <button className="text-button back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to review queue</button>
      <div className="case-heading">
        <div><span className={`category-badge category-${category}`}>{categoryLabel(category, project.analysisMode)}</span><span className="case-id">{human.excerpt_id} · {human.source_id}</span></div>
        <span className={`uncertainty uncertainty-${ai.uncertainty}`}>{ai.uncertainty} AI uncertainty</span>
      </div>

      <section className="source-excerpt">
        <span className="overline">ORIGINAL EXCERPT</span>
        <blockquote>“{human.excerpt}”</blockquote>
        {human.context && <p><strong>Context supplied to reviewer:</strong> {human.context}</p>}
      </section>

      <div className="reading-comparison">
        <section className="reading-panel human-panel">
          <div className="panel-kicker"><span className="avatar human-avatar"><UserRound /></span><span><small>FROZEN BEFORE AI EXPOSURE</small><strong>Human first-pass</strong></span></div>
          <div className="reading-code"><small>CODE</small><strong>{human.human_code}</strong></div>
          <p>{human.human_rationale || 'No rationale was supplied.'}</p>
          <div className="reading-meta"><span>Confidence <b>{human.human_confidence ?? 'not stated'}</b></span></div>
          {human.second_coder_code && (
            <div className="second-coder"><small>SECOND CODER (OPTIONAL RECORD)</small><strong>{human.second_coder_code}</strong><p>{human.second_coder_rationale}</p></div>
          )}
        </section>

        <div className="comparison-divider"><GitCompareArrows /></div>

        <section className="reading-panel ai-panel">
          <div className="panel-kicker"><span className="avatar ai-avatar">✦</span><span><small>INDEPENDENT MOCK REVIEW</small><strong>AI reading</strong></span></div>
          <div className="reading-code"><small>PRIMARY READING</small><strong>{ai.primary_suggested_code}</strong></div>
          {ai.alternative_code && <div className="alternative-code"><small>Alternative</small><strong>{ai.alternative_code}</strong></div>}
          <p>{ai.rationale}</p>
          <blockquote className="evidence-quote"><Eye size={15} /> “{ai.evidence_quote}”</blockquote>
          {ai.needs_more_context && <div className="ai-flag"><CircleAlert size={15} /> Reviewer requested more context</div>}
          {ai.possible_codebook_issue && <div className="ai-flag"><CircleAlert size={15} /> {ai.possible_codebook_issue}</div>}
        </section>
      </div>

      <section className="definitions-section">
        <div className="section-miniheading"><div><span className="overline">RELEVANT CODE DEFINITIONS</span><h2>Return to the analytic frame.</h2></div><span>{relevantCodes.length} codes in view</span></div>
        <div className="definition-grid">
          {relevantCodes.map((code) => (
            <article key={code.code}><span className="code-pill">{code.code}</span><p>{code.definition}</p><dl><dt>Include when</dt><dd>{code.include_when}</dd><dt>Exclude when</dt><dd>{code.exclude_when}</dd></dl></article>
          ))}
        </div>
      </section>

      <section className="resolution-section">
        <div className="resolution-heading"><MessageSquareText /><div><span className="overline">HUMAN RESOLUTION</span><h2>What do you decide after seeing the comparison?</h2><p>The AI does not resolve this case. Your rationale becomes part of the audit trail.</p></div></div>
        <div className="decision-grid">
          {(Object.keys(decisionLabels) as ResolutionDecision[]).map((key) => (
            <button type="button" className={decision === key ? 'selected' : ''} key={key} onClick={() => chooseDecision(key)}>
              <span className="radio-mark">{decision === key && <Check size={14} />}</span>
              <span><strong>{decisionLabels[key]}</strong><small>{decisionDescriptions[key]}</small></span>
            </button>
          ))}
        </div>

        {decision === 'revise_code' && (
          <label className="field final-code-field"><span>Revised code</span><select value={finalCode} onChange={(event) => setFinalCode(event.target.value)}>{codebook.map((code) => <option key={code.code}>{code.code}</option>)}</select></label>
        )}

        <label className="field rationale-field">
          <span>Short rationale <b>Required</b></span>
          <textarea rows={4} value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="What evidence or analytic consideration led to this decision?" />
          <small>{rationale.length} characters · describe your reasoning, not whether the AI was “right”</small>
        </label>
        {showError && (!decision || rationale.trim().length < 8) && <p className="form-error"><CircleAlert size={15} /> Choose a decision and add a short rationale of at least 8 characters.</p>}
        <div className="resolution-footer">
          <span>{existing ? 'Saving will add a new timestamp to this decision.' : 'This action records your post-exposure decision.'}</span>
          <button className="button primary" type="button" onClick={save}>Save decision <ArrowRight size={17} /></button>
        </div>
      </section>
    </div>
  )
}
