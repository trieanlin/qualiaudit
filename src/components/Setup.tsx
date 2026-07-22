import { ArrowRight, BookMarked, GitCompareArrows, Info, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { ProjectBrief } from '../types'

interface SetupProps {
  project: ProjectBrief
  onContinue: (project: ProjectBrief) => void
  locked?: boolean
}

export function Setup({ project, onContinue, locked = false }: SetupProps) {
  const [draft, setDraft] = useState(project)
  const update = (patch: Partial<ProjectBrief>) => setDraft((current) => ({ ...current, ...patch }))
  const valid = draft.name.trim() && draft.researchQuestion.trim() && draft.aiRole.trim()

  return (
    <div className="page narrow-page">
      <div className="page-heading">
        <span className="overline">PROJECT BRIEF</span>
        <h1>Frame the review before comparing interpretations.</h1>
        <p>The research question and methodological approach are visible to the reviewer. Human codes are not.</p>
      </div>

      {locked && <div className="locked-notice"><span>Frozen record</span>This project framing is read-only because the independent review has already run.</div>}

      <form className="form-card" onSubmit={(event) => { event.preventDefault(); if (valid) onContinue(draft) }}>
        <label className="field">
          <span>Project name</span>
          <input value={draft.name} onChange={(event) => update({ name: event.target.value })} required disabled={locked} />
        </label>
        <label className="field">
          <span>Research question</span>
          <textarea value={draft.researchQuestion} onChange={(event) => update({ researchQuestion: event.target.value })} rows={3} required disabled={locked} />
          <small>Keep this specific enough to orient an independent reading.</small>
        </label>
        <fieldset className="mode-fieldset">
          <legend>Analysis approach</legend>
          <div className="mode-options">
            <button
              type="button"
              className={`mode-option ${draft.analysisMode === 'codebook' ? 'selected' : ''}`}
              onClick={() => update({ analysisMode: 'codebook' })}
              aria-pressed={draft.analysisMode === 'codebook'}
              disabled={locked}
            >
              <BookMarked />
              <span><strong>Codebook / Framework Analysis</strong><small>Compare code application, ambiguity, and consistency.</small></span>
            </button>
            <button
              type="button"
              className={`mode-option ${draft.analysisMode === 'reflexive' ? 'selected' : ''}`}
              onClick={() => update({ analysisMode: 'reflexive' })}
              aria-pressed={draft.analysisMode === 'reflexive'}
              disabled={locked}
            >
              <Sparkles />
              <span><strong>Reflexive Thematic Analysis</strong><small>Surface alternative readings and productive divergence.</small></span>
            </button>
          </div>
        </fieldset>

        <div className="method-note">
          <Info size={18} />
          {draft.analysisMode === 'reflexive' ? (
            <p><strong>Reflexive language is active.</strong> The review will avoid accuracy claims and Cohen’s kappa. Divergence is presented as material for reflexivity, not error.</p>
          ) : (
            <p><strong>Codebook comparison is active.</strong> The review can describe agreement patterns and code ambiguity, while keeping AI separate from intercoder reliability.</p>
          )}
        </div>

        <label className="field">
          <span>Intended role of AI</span>
          <textarea value={draft.aiRole} onChange={(event) => update({ aiRole: event.target.value })} rows={3} required disabled={locked} />
        </label>

        <div className="form-footer">
          <span><GitCompareArrows size={16} /> This framing travels with the audit.</span>
          <button className="button primary" type="submit" disabled={!valid}>{locked ? 'Return to review queue' : 'Review materials'} <ArrowRight size={17} /></button>
        </div>
      </form>
    </div>
  )
}
