import { ArrowLeft, ArrowRight, Check, CircleAlert, Eye, GitCompareArrows, MessageSquareText, NotebookPen, UserRound } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { categoryLabel, classifyCase } from '../lib/queue'
import { decisionLabels } from '../lib/resolutions'
import { secondCoderRelationshipLabel } from '../lib/secondCoder'
import type {
  AiReview,
  CodebookChange,
  CodeDefinition,
  HumanCodedExcerpt,
  ProjectBrief,
  ReflexiveMemo,
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
  memos: ReflexiveMemo[]
  onBack: () => void
  onSave: (resolution: Resolution, codebookChange?: CodebookChange) => void
  onAddMemo: (memo: ReflexiveMemo) => void
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
  memos,
  onBack,
  onSave,
  onAddMemo,
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
  const [memoAuthor, setMemoAuthor] = useState('Researcher')
  const [memoBody, setMemoBody] = useState('')
  const [memoError, setMemoError] = useState(false)
  const decisionRefs = useRef<Partial<Record<ResolutionDecision, HTMLButtonElement | null>>>({})
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const memoErrorRef = useRef<HTMLDivElement>(null)
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

  const addMemo = () => {
    if (!existing || memoAuthor.trim().length < 2 || memoBody.trim().length < 12) {
      setMemoError(true)
      window.requestAnimationFrame(() => memoErrorRef.current?.focus())
      return
    }
    const createdAt = new Date().toISOString()
    onAddMemo({
      memo_version: 'qualiaudit-reflexive-memo-v0.1',
      id: crypto.randomUUID(),
      excerpt_id: human.excerpt_id,
      resolution_decided_at: existing.decided_at,
      decision: existing.decision,
      author: memoAuthor.trim(),
      body: memoBody.trim(),
      created_at: createdAt,
    })
    setMemoBody('')
    setMemoError(false)
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

      {human.second_coder_code && (
        <section className="second-human-case" aria-labelledby="second-human-case-heading">
          <div className="second-human-case-heading">
            <span className="avatar second-human-avatar"><UserRound /></span>
            <div>
              <small>OPTIONAL SECOND-HUMAN RECORD · FROZEN BEFORE AI EXPOSURE</small>
              <h2 id="second-human-case-heading">A separate human comparison</h2>
            </div>
            <span className="second-human-relationship">
              {secondCoderRelationshipLabel(
                human.second_coder_code === human.human_code ? 'same_code' : 'different_code',
                project.analysisMode,
              )}
            </span>
          </div>
          <div className="second-human-codes">
            <div><small>FIRST HUMAN</small><strong>{human.human_code}</strong></div>
            <GitCompareArrows aria-hidden="true" />
            <div><small>SECOND HUMAN</small><strong>{human.second_coder_code}</strong></div>
          </div>
          <p>{human.second_coder_rationale || 'No second-human rationale was supplied.'}</p>
          <div className="second-human-note" role="note">
            This record was withheld from the AI reviewer. It is shown separately and does not determine the human–AI queue category.
          </div>
        </section>
      )}

      <div className="reading-comparison">
        <section className="reading-panel human-panel">
          <div className="panel-kicker"><span className="avatar human-avatar"><UserRound /></span><span><small>FROZEN BEFORE AI EXPOSURE</small><strong>Human first-pass</strong></span></div>
          <div className="reading-code"><small>CODE</small><strong>{human.human_code}</strong></div>
          <p>{human.human_rationale || 'No rationale was supplied.'}</p>
          <div className="reading-meta"><span>Confidence <b>{human.human_confidence ?? 'not stated'}</b></span></div>
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

      {existing && (
        <section className="reflexive-memo-section" aria-labelledby="reflexive-memo-heading">
          <div className="reflexive-memo-heading">
            <NotebookPen aria-hidden="true" />
            <div>
              <span className="overline">RESEARCHER REFLEXIVE MEMO</span>
              <h2 id="reflexive-memo-heading">What changed in your analytic attention?</h2>
              <p>
                {project.analysisMode === 'reflexive'
                  ? 'Record surprise, positionality, tension, or an alternative reading you want to carry forward.'
                  : 'Record whether the comparison revealed a code boundary, consistency question, or contextual assumption.'}
                {' '}This memo stays in the human audit record and is never sent back to the AI reviewer.
              </p>
            </div>
          </div>

          {memos.length > 0 && (
            <div className="reflexive-memo-list" aria-label="Saved reflexive memos">
              {memos.map((memo) => (
                <article key={memo.id}>
                  <div><strong>{memo.author}</strong><time dateTime={memo.created_at}>{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(memo.created_at))}</time></div>
                  <p>{memo.body}</p>
                  <small>Linked to the {decisionLabels[memo.decision].toLowerCase()} decision recorded at {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(memo.resolution_decided_at))}.</small>
                </article>
              ))}
            </div>
          )}

          <div className="reflexive-memo-editor">
            <label className="field">
              <span>Memo author <b>Required</b></span>
              <input
                value={memoAuthor}
                aria-invalid={memoError && memoAuthor.trim().length < 2 ? 'true' : undefined}
                onChange={(event) => setMemoAuthor(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Reflexive memo <b>Required</b></span>
              <textarea
                rows={4}
                value={memoBody}
                aria-invalid={memoError && memoBody.trim().length < 12 ? 'true' : undefined}
                aria-describedby="reflexive-memo-help"
                placeholder="What did this comparison make visible, complicate, or leave unresolved?"
                onChange={(event) => setMemoBody(event.target.value)}
              />
              <small id="reflexive-memo-help">{memoBody.length} characters · describe your analytic reflection rather than scoring the AI.</small>
            </label>
          </div>
          {memoError && (memoAuthor.trim().length < 2 || memoBody.trim().length < 12) && (
            <div className="form-errors" ref={memoErrorRef} role="alert" tabIndex={-1}>
              <p className="form-error"><CircleAlert size={15} /> Add an author and a reflexive memo of at least 12 characters.</p>
            </div>
          )}
          <div className="reflexive-memo-footer">
            <span>{memos.length} memo{memos.length === 1 ? '' : 's'} linked to this case · append-only audit record</span>
            <button className="button secondary" type="button" onClick={addMemo}><NotebookPen size={16} /> Add memo</button>
          </div>
        </section>
      )}
    </div>
  )
}
