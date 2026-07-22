import { ArrowLeft, ArrowRight, Check, Database, EyeOff, FileLock2, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { buildBlindReviewPayload, runMockBlindReview } from '../lib/reviewer'
import type { AiReview, CodeDefinition, HumanCodedExcerpt, ProjectBrief } from '../types'

interface FreezeProps {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  onBack: () => void
  onFreeze: () => void
}

export function FreezeReview({ project, codebook, excerpts, onBack, onFreeze }: FreezeProps) {
  return (
    <div className="page narrow-page freeze-page">
      <button className="text-button back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to materials</button>
      <div className="freeze-symbol" aria-hidden="true"><FileLock2 /></div>
      <div className="page-heading centered-heading">
        <span className="overline">BLIND REVIEW CHECKPOINT</span>
        <h1>Freeze the human interpretation.</h1>
        <p>This creates a time-stamped first-pass record before the AI reading is generated.</p>
      </div>

      <section className="freeze-card">
        <div className="freeze-statement">
          <EyeOff size={21} />
          <div>
            <strong>Your initial interpretation will be saved.</strong>
            <p>The AI reviewer will not see your human codes.</p>
          </div>
        </div>
        <div className="blind-columns">
          <div>
            <h2><Check size={16} /> Reviewer can see</h2>
            <ul>
              <li>Research question</li>
              <li>{project.analysisMode === 'reflexive' ? 'Reflexive analysis framing' : 'Codebook / framework analysis framing'}</li>
              <li>{codebook.length} code definitions</li>
              <li>Excerpt text and necessary context</li>
            </ul>
          </div>
          <div className="withheld-column">
            <h2><EyeOff size={16} /> Withheld from reviewer</h2>
            <ul>
              <li>Human and second-coder codes</li>
              <li>Human rationales and confidence</li>
              <li>Any later final decisions</li>
              <li>Resolution history</li>
            </ul>
          </div>
        </div>
        <div className="freeze-record"><Database size={16} /><span><strong>Snapshot contents</strong>{excerpts.length} excerpts · {codebook.length} codes · project brief</span></div>
      </section>

      <div className="third-party-note"><ShieldCheck size={18} /><span><strong>No third-party model is connected.</strong> The v0.1 demo runs a deterministic reviewer entirely in this browser.</span></div>

      <button className="button primary large centered-button" type="button" onClick={onFreeze}>Freeze &amp; run blind review <ArrowRight size={18} /></button>
    </div>
  )
}

interface ReviewingProps {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  onDone: (reviews: AiReview[]) => void
}

export function Reviewing({ project, codebook, excerpts, onDone }: ReviewingProps) {
  const [processed, setProcessed] = useState(0)
  const finished = useRef(false)

  useEffect(() => {
    const payload = buildBlindReviewPayload(project, codebook, excerpts)
    const reviews = runMockBlindReview(payload)
    const interval = window.setInterval(() => {
      setProcessed((current) => {
        const next = Math.min(excerpts.length, current + Math.max(1, Math.ceil(excerpts.length / 4)))
        if (next === excerpts.length && !finished.current) {
          finished.current = true
          window.clearInterval(interval)
          window.setTimeout(() => onDone(reviews), 450)
        }
        return next
      })
    }, 260)
    return () => window.clearInterval(interval)
  }, [codebook, excerpts, onDone, project])

  const percentage = excerpts.length ? Math.round((processed / excerpts.length) * 100) : 0

  return (
    <div className="reviewing-page" aria-live="polite">
      <div className="review-orbit" aria-hidden="true"><span /><span /><EyeOff /></div>
      <span className="overline">INDEPENDENT REVIEW IN PROGRESS</span>
      <h1>Creating a separate reading.</h1>
      <p>The local reviewer is working from the project framing, codebook, excerpt, and context only.</p>
      <div className="progress-card">
        <div><span>Deterministic mock reviewer</span><strong>{processed} / {excerpts.length} excerpts</strong></div>
        <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div>
        <small>{processed < excerpts.length ? 'Comparing textual evidence with code definitions…' : 'Independent readings recorded.'}</small>
      </div>
      <div className="blind-reminder"><FileLock2 size={17} /> Human codes remain outside the review payload</div>
    </div>
  )
}
