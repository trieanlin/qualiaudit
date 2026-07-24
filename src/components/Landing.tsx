import { ArrowRight, EyeOff, FileClock, FileUp, GitCompareArrows, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ReviewState } from '../hooks/useReviewState'
import { ProjectFileImportDialog } from './ProjectFileImportDialog'
import { AppHeader } from './Shell'

interface LandingProps {
  onOpenSample: () => void
  onNewReview: () => void
  onRestoreProject: (state: ReviewState) => void
}

export function Landing({ onOpenSample, onNewReview, onRestoreProject }: LandingProps) {
  const [projectFile, setProjectFile] = useState<File | null>(null)
  const projectInput = useRef<HTMLInputElement>(null)

  return (
    <div className="landing-page">
      <AppHeader onReset={() => undefined} inProject={false} />
      <main id="main-content">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow-pill"><span /> METHOD-AWARE · HUMAN-LED</div>
            <h1>A second reading,<br /><em>not a final answer.</em></h1>
            <p className="hero-lede">
              QualiAudit helps qualitative researchers review coded excerpts, examine human–AI divergence, and document what changed — without treating AI as ground truth.
            </p>
            <div className="hero-actions">
              <button className="button primary large" type="button" onClick={onOpenSample}>
                Open synthetic review <ArrowRight size={18} />
              </button>
              <button className="button secondary large" type="button" onClick={onNewReview}>Set up a review</button>
              <button className="button quiet large" type="button" onClick={() => projectInput.current?.click()}>
                <FileUp size={17} /> Open project file
              </button>
              <input
                ref={projectInput}
                hidden
                type="file"
                accept=".json,.qualiaudit.json,application/json"
                onChange={(event) => {
                  setProjectFile(event.target.files?.[0] ?? null)
                  event.currentTarget.value = ''
                }}
              />
            </div>
            <p className="demo-reassurance"><ShieldCheck size={15} /> Fictional data. Runs locally. No API key or account.</p>
          </div>
          <div className="hero-artifact" aria-label="Preview of an independent qualitative coding review">
            <div className="artifact-topline">
              <span className="tiny-label">REVIEW CASE · SYN-002</span>
              <span className="artifact-status"><span /> ALTERNATIVE READING</span>
            </div>
            <blockquote>“My daughter liked looking at the weekly score with me, but… I started to feel as though I was being checked up on.”</blockquote>
            <div className="comparison-thread">
              <div className="reading human-reading">
                <span className="reading-icon">H</span>
                <div>
                  <span>HUMAN FIRST-PASS</span>
                  <strong>FAMILY_FEEDBACK</strong>
                  <p>Foregrounds the shared review and family involvement.</p>
                </div>
              </div>
              <div className="thread-line"><GitCompareArrows size={18} /></div>
              <div className="reading ai-reading">
                <span className="reading-icon"><span className="spark">✦</span></span>
                <div>
                  <span>INDEPENDENT AI READING</span>
                  <strong>PRIVACY_BOUNDARY</strong>
                  <p>Centres discomfort with being monitored by another person.</p>
                </div>
              </div>
            </div>
            <div className="artifact-footer"><EyeOff size={15} /> AI review completed without access to the human code</div>
          </div>
        </section>

        <section className="principles section-wrap" aria-labelledby="principles-title">
          <div className="section-heading">
            <span className="overline">BUILT AROUND THE METHOD</span>
            <h2 id="principles-title">A review layer for interpretive work.</h2>
          </div>
          <div className="principle-grid">
            <article><EyeOff /><h3>Blind by design</h3><p>Human interpretations are frozen before AI review, reducing anchoring in the review itself.</p></article>
            <article><GitCompareArrows /><h3>Divergence over accuracy</h3><p>Different readings become material for reflection, not a simplistic right-or-wrong score.</p></article>
            <article><FileClock /><h3>Decisions stay traceable</h3><p>Every kept, changed, rejected, or unresolved interpretation becomes part of the audit trail.</p></article>
          </div>
        </section>
      </main>
      <footer className="landing-footer section-wrap">
        <span>Open-source foundations for transparent qualitative research.</span>
        <span>QualiAudit · Synthetic demo</span>
      </footer>
      {projectFile && (
        <ProjectFileImportDialog
          file={projectFile}
          onClose={() => setProjectFile(null)}
          onRestore={(state) => {
            setProjectFile(null)
            onRestoreProject(state)
          }}
        />
      )}
    </div>
  )
}
