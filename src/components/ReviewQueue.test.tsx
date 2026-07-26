import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildBlindReviewPayload, runMockBlindReview } from '../lib/reviewer'
import { ReviewQueue } from './ReviewQueue'

function renderQueue(analysisMode: 'codebook' | 'reflexive' = 'codebook') {
  const project = { ...SAMPLE_PROJECT, analysisMode }
  const reviews = runMockBlindReview(
    buildBlindReviewPayload(project, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
  )
  return render(
    <ReviewQueue
      project={project}
      codebook={SAMPLE_CODEBOOK}
      excerpts={SAMPLE_EXCERPTS}
      reviews={reviews}
      resolutions={[]}
      onOpenCase={vi.fn()}
      onOpenAudit={vi.fn()}
    />,
  )
}

describe('review queue second-human summary', () => {
  it('keeps optional human–human counts outside the AI queue summary', () => {
    renderQueue()

    const summary = screen.getByRole('heading', { name: 'Second-human comparison' }).closest('section')
    expect(summary).not.toBeNull()
    expect(within(summary as HTMLElement).getByText('Records').nextSibling).toHaveTextContent('3')
    expect(within(summary as HTMLElement).getByText('Direct code overlap').nextSibling).toHaveTextContent('1')
    expect(within(summary as HTMLElement).getByText('Different interpretations').nextSibling).toHaveTextContent('2')
    expect(within(summary as HTMLElement).getByText(/not included in the AI queue categories/)).toBeInTheDocument()
  })

  it('uses non-error language in reflexive mode', () => {
    renderQueue('reflexive')

    const summary = screen.getByRole('heading', { name: 'Second-human comparison' }).closest('section')
    expect(summary).not.toBeNull()
    expect(within(summary as HTMLElement).getByText('Interpretive overlap')).toBeInTheDocument()
    expect(within(summary as HTMLElement).getByText('Alternative readings')).toBeInTheDocument()
    expect(within(summary as HTMLElement).getByText(/not labelled as error/)).toBeInTheDocument()
  })
})
