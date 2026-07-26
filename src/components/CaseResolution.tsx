import { ArrowLeft, ArrowRight, Check, CircleAlert, Eye, GitCompareArrows, MessageSquareText, UserRound } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { categoryLabel, classifyCase } from '../lib/queue'
import { decisionLabels } from '../lib/resolutions'
import type {
  AiReview,
  CodebookChange,
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
  excerpts: HumanCodedExcerpt[]
  ai: AiReview
  existing?: Resolution
  existingCodebookChange?: CodebookChange
  onBack: () => void
  onSave: (resolution: Resolution, codebookChange?: CodebookChange) => void
}

const CHANGED_DECISIONS = new Set<ResolutionDecision>(['accept_ai', 'keep_both', 'revise_code', 'revise_boundary', 'revise_codebook'])
const DECISION_KEYS = Object.keys(decisionLabels) as ResolutionDecision[]

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

function defaultAffectedIds(
  code: string,
  excerpts: HumanCodedExcerpt[],
  triggerExcerptId: string,
): string[] {
  return [...new Set([
    triggerExcerptId,
    ...excerpts.filter((excerpt) => excerpt.human_code === code).map((excerpt) => excerpt.excerpt_id),
  ])]
}

export function CaseResolution({
  project,
  codebook,
  human,
  excerpts,
  ai,
  existing,
  existingCodebookChange,
  onBack,
  onSave,
}: CaseResolutionProps) {
  const initialChangeCode = existingCodebookChange?.code ?? human.human_code
  const initialCodeDefinition = codebook.find((item) => item.code === initialChangeCode) ?? codebook[0]
  const [decision, setDecision] = useState<ResolutionDecision | null>(existing?.decision ?? null)
  const [rationale, setRationale] = useState(existing?.rationale ?? '')
  const [finalCode, setFinalCode] = useState(existing?.final_code ?? human.human_code)
  const [changeCode, setChangeCode] = useState(initialCodeDefinition?.code ?? '')
  const [changeAuthor, setChangeAuthor] = useState(existingCodebookChange?.author ?? 'Researcher')
  const [changeDefinition, setChangeDefinition] = useState(existingCodebookChange?.after.definition ?? initialCodeDefinition?.definition ?? '')
  const [changeIncludeWhen, setChangeIncludeWhen] = useState(existingCodebookChange?.after.include_when ?? initialCodeDefinition?.include_when ?? '')
  const [changeExcludeWhen, setChangeExcludeWhen] = useState(existingCodebookChange?.after.exclude_when ?? initialCodeDefinition?.exclude_when ?? '')
  const [changeExample, setChangeExample] = useState(existingCodebookChange?.after.example ?? initialCodeDefinition?.example ?? '')
  const [affectedExcerptIds, setAffectedExcerptIds] = useState<string[]>(
    existingCodebookChange?.affected_excerpt_ids
      ?? defaultAffectedIds(initialCodeDefinition?.code ?? '', excerpts, human.excerpt_id),
  )
  const [showError, setShowError] = useState(false)
  const decisionRefs = useRef<Partial<Record<ResolutionDecision, HTMLButtonElement | null>>>({})
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const category = classifyCase(human, ai, codebook)
  const relevantCodes = useMemo(() => {
    const wanted = new Set([human.human_code, ai.primary_suggested_code, ai.alternative_code].filter(Boolean))
    return codebook.filter((item) => wanted.has(item.code))
  }, [ai, codebook, human.human_code])
  const selectedChangeCode = codebook.find((item) => item.code === changeCode)
  const codebookDraftChanged = Boolean(selectedChangeCode) && (
    changeDefinition.trim() !== selectedChangeCode?.definition
    || changeIncludeWhen.trim() !== selectedChangeCode?.include_when
    || changeExcludeWhen.trim() !== selectedChangeCode?.exclude_when
    || changeExample.trim() !== (selectedChangeCode?.example ?? '')
  )
  const codebookChangeInvalid = decision === 'revise_codebook' && (
    !selectedChangeCode
    || changeAuthor.trim().length < 2
    || changeDefinition.trim().length === 0
    || changeIncludeWhen.trim().length === 0
    || changeExcludeWhen.trim().length === 0
    || !codebookDraftChanged
    || affectedExcerptIds.length === 0
  )

  const chooseDecision = (next: ResolutionDecision) => {
    setDecision(next)
    if (next === 'accept_ai') setFinalCode(ai.primary_suggested_code)
    else if (next === 'keep_both') setFinalCode(`${human.human_code} + ${ai.primary_suggested_code}`)
    else if (next !== 'revise_code') setFinalCode(human.human_code)
  }

  const moveDecisionFocus = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    current: ResolutionDecision,
  ) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const currentIndex = DECISION_KEYS.indexOf(current)
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? DECISION_KEYS.length - 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? (currentIndex - 1 + DECISION_KEYS.length) % DECISION_KEYS.length
          : (currentIndex + 1) % DECISION_KEYS.length
    const next = DECISION_KEYS[nextIndex]
    chooseDecision(next)
    decisionRefs.current[next]?.focus()
  }

  const chooseChangeCode = (nextCode: string) => {
    const next = codebook.find((item) => item.code === nextCode)
    if (!next) return
    setChangeCode(next.code)
    setChangeDefinition(next.definition)
    setChangeIncludeWhen(next.include_when)
    setChangeExcludeWhen(next.exclude_when)
    setChangeExample(next.example ?? '')
    setAffectedExcerptIds(defaultAffectedIds(next.code, excerpts, human.excerpt_id))
  }

  const toggleAffectedExcerpt = (excerptId: string) => {
    setAffectedExcerptIds((current) => (
      current.includes(excerptId)
        ? current.filter((item) => item !== excerptId)
        : [...current, excerptId]
    ))
  }

  const save = () => {
    if (!decision || rationale.trim().length < 8 || codebookChangeInvalid) {
      setShowError(true)
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus())
      return
    }
    const decidedAt = new Date().toISOString()
    const codebookChange = decision === 'revise_codebook' && selectedChangeCode
      ? {
          ledger_version: 'qualiaudit-codebook-change-v0.1' as const,
          id: crypto.randomUUID(),
          trigger_excerpt_id: human.excerpt_id,
          code: selectedChangeCode.code,
          before: { ...selectedChangeCode },
          after: {
            code: selectedChangeCode.code,
            definition: changeDefinition.trim(),
            include_when: changeIncludeWhen.trim(),
            exclude_when: changeExcludeWhen.trim(),
            ...(changeExample.trim() ? { example: changeExample.trim() } : {}),
          },
          author: changeAuthor.trim(),
          rationale: rationale.trim(),
          created_at: decidedAt,
          affected_excerpt_ids: [...affectedExcerptIds],
          unresolved_recode_excerpt_ids: [...affectedExcerptIds],
        }
      : undefined
    onSave({
      excerpt_id: human.excerpt_id,
      decision,
      rationale: rationale.trim(),
      final_code: finalCode,
      codebook_change_id: codebookChange?.id,
      decided_at: decidedAt,
      changed_after_ai_exposure: CHANGED_DECISIONS.has(decision),
    }, codebookChange)
  }

  return (
    <div className="page wide-page case-page">
      <button className="text-button back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to review queue</button>
      <div className="case-heading">
        <div>
          <span className={`category-badge category-${category}`}>{categoryLabel(category, project.analysisMode)}</span>
          <h1 className="case-id">
            <span className="sr-only">Review case</span>{' '}
            {human.excerpt_id} · {human.source_id}
          </h1>
        </div>
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
        <div className="resolution-heading"><MessageSquareText /><div><span className="overline">HUMAN RESOLUTION</span><h2 id="resolution-decision-heading">What do you decide after seeing the comparison?</h2><p>The AI does not resolve this case. Your rationale becomes part of the audit trail.</p></div></div>
        <div
          className="decision-grid"
          role="radiogroup"
          aria-labelledby="resolution-decision-heading"
          aria-invalid={showError && !decision ? 'true' : undefined}
        >
          {DECISION_KEYS.map((key, index) => (
            <button
              ref={(element) => {
                decisionRefs.current[key] = element
              }}
              type="button"
              role="radio"
              aria-checked={decision === key}
              tabIndex={decision === key || (!decision && index === 0) ? 0 : -1}
              className={decision === key ? 'selected' : ''}
              key={key}
              onClick={() => chooseDecision(key)}
              onKeyDown={(event) => moveDecisionFocus(event, key)}
            >
              <span className="radio-mark">{decision === key && <Check size={14} />}</span>
              <span><strong>{decisionLabels[key]}</strong><small>{decisionDescriptions[key]}</small></span>
            </button>
          ))}
        </div>

        {decision === 'revise_code' && (
          <label className="field final-code-field"><span>Revised code</span><select value={finalCode} onChange={(event) => setFinalCode(event.target.value)}>{codebook.map((code) => <option key={code.code}>{code.code}</option>)}</select></label>
        )}

        {decision === 'revise_codebook' && selectedChangeCode && (
          <section className="codebook-change-editor" aria-labelledby="codebook-change-heading">
            <div className="codebook-change-heading">
              <div>
                <span className="overline">CODEBOOK CHANGE LEDGER</span>
                <h3 id="codebook-change-heading">Describe a proposed revision without changing the frozen codebook.</h3>
              </div>
              <span>Version 0.1</span>
            </div>

            <div className="codebook-change-meta">
              <label className="field">
                <span>Code to revise <b>Required</b></span>
                <select value={changeCode} onChange={(event) => chooseChangeCode(event.target.value)}>
                  {codebook.map((code) => <option key={code.code} value={code.code}>{code.code}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Change author <b>Required</b></span>
                <input
                  value={changeAuthor}
                  aria-invalid={showError && changeAuthor.trim().length < 2 ? 'true' : undefined}
                  aria-describedby="change-author-help"
                  onChange={(event) => setChangeAuthor(event.target.value)}
                />
                <small id="change-author-help">Stored locally and included in project/audit exports.</small>
              </label>
            </div>

            <div className="codebook-before-after">
              <article>
                <span className="overline">FROZEN BEFORE</span>
                <dl>
                  <div><dt>Definition</dt><dd>{selectedChangeCode.definition}</dd></div>
                  <div><dt>Include when</dt><dd>{selectedChangeCode.include_when}</dd></div>
                  <div><dt>Exclude when</dt><dd>{selectedChangeCode.exclude_when}</dd></div>
                  {selectedChangeCode.example && <div><dt>Example</dt><dd>{selectedChangeCode.example}</dd></div>}
                </dl>
              </article>
              <fieldset>
                <legend>Proposed after</legend>
                <label className="field"><span>Definition <b>Required</b></span><textarea rows={3} value={changeDefinition} onChange={(event) => setChangeDefinition(event.target.value)} /></label>
                <label className="field"><span>Include when <b>Required</b></span><textarea rows={3} value={changeIncludeWhen} onChange={(event) => setChangeIncludeWhen(event.target.value)} /></label>
                <label className="field"><span>Exclude when <b>Required</b></span><textarea rows={3} value={changeExcludeWhen} onChange={(event) => setChangeExcludeWhen(event.target.value)} /></label>
                <label className="field"><span>Example <i>Optional</i></span><textarea rows={2} value={changeExample} onChange={(event) => setChangeExample(event.target.value)} /></label>
              </fieldset>
            </div>

            <fieldset className="affected-excerpts">
              <legend>Affected excerpts <b>Required</b></legend>
              <p>Selected excerpts enter unresolved recoding work; their frozen codes are not changed.</p>
              <div>
                {excerpts.map((excerpt) => (
                  <label key={excerpt.excerpt_id}>
                    <input
                      type="checkbox"
                      checked={affectedExcerptIds.includes(excerpt.excerpt_id)}
                      onChange={() => toggleAffectedExcerpt(excerpt.excerpt_id)}
                    />
                    <span><strong>{excerpt.excerpt_id}</strong><small>{excerpt.human_code} · {excerpt.excerpt}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        )}

        <label className="field rationale-field">
          <span>Short rationale <b>Required</b></span>
          <textarea
            rows={4}
            value={rationale}
            aria-invalid={showError && rationale.trim().length < 8 ? 'true' : undefined}
            aria-describedby="resolution-rationale-help"
            onChange={(event) => setRationale(event.target.value)}
            placeholder="What evidence or analytic consideration led to this decision?"
          />
          <small id="resolution-rationale-help">{rationale.length} characters · describe your reasoning, not whether the AI was “right”</small>
        </label>
        {showError && (!decision || rationale.trim().length < 8 || codebookChangeInvalid) && (
          <div className="form-errors" ref={errorSummaryRef} role="alert" tabIndex={-1}>
            {(!decision || rationale.trim().length < 8) && <p className="form-error"><CircleAlert size={15} /> Choose a decision and add a short rationale of at least 8 characters.</p>}
            {codebookChangeInvalid && <p className="form-error"><CircleAlert size={15} /> Complete the author, proposed definition guidance, at least one real change, and one affected excerpt.</p>}
          </div>
        )}
        <div className="resolution-footer">
          <span>{existing ? 'Saving will add a new timestamp to this decision.' : 'This action records your post-exposure decision.'}</span>
          <button className="button primary" type="button" onClick={save}>Save decision <ArrowRight size={17} /></button>
        </div>
      </section>
    </div>
  )
}
