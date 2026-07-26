import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleDashed,
  Filter,
  GitCompareArrows,
  MessageCircleQuestion,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { categoryLabel, classifyCase, QUEUE_ORDER } from '../lib/queue'
import { buildSecondCoderComparisons, summariseSecondCoderComparisons } from '../lib/secondCoder'
import type {
  AiReview,
  CodeDefinition,
  HumanCodedExcerpt,
  ProjectBrief,
  Resolution,
} from '../types'
import { ModeBadge } from './Shell'

interface QueueProps {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  reviews: AiReview[]
  resolutions: Resolution[]
  onOpenCase: (excerptId: string) => void
  onOpenAudit: () => void
}

type QueueFilter = 'attention' | 'all' | 'resolved'

export function ReviewQueue({ project, codebook, excerpts, reviews, resolutions, onOpenCase, onOpenAudit }: QueueProps) {
  const [filter, setFilter] = useState<QueueFilter>('attention')
  const items = useMemo(() => excerpts.map((human) => {
    const ai = reviews.find((review) => review.excerpt_id === human.excerpt_id)
    if (!ai) return null
    const resolution = resolutions.find((item) => item.excerpt_id === human.excerpt_id)
    return { human, ai, resolution, category: classifyCase(human, ai, codebook) }
  }).filter((item): item is NonNullable<typeof item> => Boolean(item)), [codebook, excerpts, resolutions, reviews])

  const attentionItems = items.filter((item) => item.category !== 'aligned' && !item.resolution)
  const resolvedItems = items.filter((item) => item.resolution)
  const visibleItems = (filter === 'resolved' ? resolvedItems : filter === 'attention' ? attentionItems : items)
    .sort((a, b) => QUEUE_ORDER.indexOf(a.category) - QUEUE_ORDER.indexOf(b.category))

  const aligned = items.filter((item) => item.category === 'aligned').length
  const related = items.filter((item) => item.category === 'partial').length
  const secondCoderSummary = useMemo(
    () => summariseSecondCoderComparisons(buildSecondCoderComparisons(excerpts)),
    [excerpts],
  )

  return (
    <div className="page wide-page queue-page">
      <div className="page-heading row-heading queue-heading">
        <div>
          <div className="heading-badges"><span className="overline">REVIEW QUEUE</span><ModeBadge mode={project.analysisMode} /></div>
          <h1>{project.analysisMode === 'reflexive' ? 'Read across the divergence.' : 'Focus on cases that need judgment.'}</h1>
          <p>{project.analysisMode === 'reflexive' ? 'Alternative readings are prompts for reflexivity, not evidence of coding error.' : 'Comparison organises attention. It does not give the AI decision authority.'}</p>
        </div>
        <button className="button secondary" type="button" onClick={onOpenAudit}>View audit trail <ArrowRight size={16} /></button>
      </div>

      {project.analysisMode === 'codebook' ? (
        <section className="method-summary codebook-summary">
          <div><span className="summary-icon"><BookOpenCheck /></span><span><small>DIRECT CODE OVERLAP</small><strong>{aligned} of {items.length}</strong></span></div>
          <div><span><small>RELATED / ALTERNATIVE</small><strong>{related}</strong></span></div>
          <p>This is descriptive agreement with a mock AI reading, not intercoder reliability. Cohen’s kappa is intentionally not calculated.</p>
        </section>
      ) : (
        <section className="method-summary reflexive-summary">
          <Sparkles />
          <div><strong>Interpretive comparison, not an accuracy test</strong><p>Use overlap, tension, and uncertainty to make your analytic position more visible.</p></div>
        </section>
      )}

      {secondCoderSummary.total > 0 && (
        <section className="second-human-summary" aria-labelledby="second-human-summary-heading">
          <div className="second-human-summary-heading">
            <span><UsersRound /></span>
            <div>
              <small>OPTIONAL PRE-AI RECORD · ANALYSED SEPARATELY</small>
              <h2 id="second-human-summary-heading">Second-human comparison</h2>
            </div>
          </div>
          <dl>
            <div><dt>Records</dt><dd>{secondCoderSummary.total}</dd></div>
            <div><dt>{project.analysisMode === 'reflexive' ? 'Interpretive overlap' : 'Direct code overlap'}</dt><dd>{secondCoderSummary.sameCode}</dd></div>
            <div><dt>{project.analysisMode === 'reflexive' ? 'Alternative readings' : 'Different interpretations'}</dt><dd>{secondCoderSummary.differentCode}</dd></div>
          </dl>
          <p>
            These descriptive human–human records are not included in the AI queue categories or human–AI overlap count.
            {project.analysisMode === 'codebook' ? ' No intercoder reliability coefficient is inferred from this optional subset.' : ' Divergence is preserved as interpretive material, not labelled as error.'}
          </p>
        </section>
      )}

      <div className="queue-controls">
        <div className="filter-group" role="group" aria-label="Filter review cases">
          <span><Filter size={15} /> Show</span>
          <button type="button" aria-pressed={filter === 'attention'} className={filter === 'attention' ? 'active' : ''} onClick={() => setFilter('attention')}>Needs reflection <b>{attentionItems.length}</b></button>
          <button type="button" aria-pressed={filter === 'all'} className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All cases <b>{items.length}</b></button>
          <button type="button" aria-pressed={filter === 'resolved'} className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>Resolved <b>{resolvedItems.length}</b></button>
        </div>
        <span className="queue-helper"><MessageCircleQuestion size={15} /> Start with a reading that changes what you notice.</span>
      </div>

      <div className="queue-list">
        {visibleItems.length === 0 ? (
          <div className="empty-queue"><Check /><h2>{filter === 'attention' ? 'No unresolved attention cases.' : 'Nothing here yet.'}</h2><p>Open the audit trail to inspect recorded decisions and export the review.</p></div>
        ) : visibleItems.map(({ human, ai, resolution, category }, index) => (
          <button className={`queue-card ${resolution ? 'resolved' : ''}`} type="button" key={human.excerpt_id} onClick={() => onOpenCase(human.excerpt_id)}>
            <div className="queue-card-index"><span>{String(index + 1).padStart(2, '0')}</span><i /></div>
            <div className="queue-card-body">
              <div className="queue-card-topline">
                <span className={`category-badge category-${category}`}><CircleDashed size={13} /> {categoryLabel(category, project.analysisMode)}</span>
                <span>{human.excerpt_id} · {human.source_id}</span>
                {resolution && <span className="resolved-badge"><Check size={13} /> Resolved</span>}
              </div>
              <blockquote>“{human.excerpt}”</blockquote>
              <div className="mini-comparison">
                <span><small>HUMAN FIRST-PASS</small><strong>{human.human_code}</strong></span>
                <GitCompareArrows size={17} />
                <span><small>AI READING</small><strong>{ai.primary_suggested_code}</strong></span>
                <span className={`uncertainty uncertainty-${ai.uncertainty}`}>{ai.uncertainty} uncertainty</span>
              </div>
            </div>
            <ChevronRight className="queue-chevron" size={21} />
          </button>
        ))}
      </div>
    </div>
  )
}
