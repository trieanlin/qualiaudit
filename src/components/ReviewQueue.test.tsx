import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App, { QUEUE_DISPLAY_SESSION_KEY } from '../App'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { INITIAL_STATE, STORAGE_KEY } from '../hooks/useReviewState'
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

describe('safe batch triage', () => {
  it('shows every reviewed case and pins protected attention without offering a bulk decision', async () => {
    const user = userEvent.setup()
    const view = renderQueue()

    await user.click(screen.getByRole('button', { name: 'Triage groups' }))

    expect(screen.getByRole('heading', { name: 'Every unresolved case stays visible.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Protected attention' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Interpretation differences' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Routine overlap' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recorded decisions' })).toBeInTheDocument()
    expect(view.container.querySelectorAll('.queue-card')).toHaveLength(SAMPLE_EXCERPTS.length)
    expect(screen.getByText(`${SAMPLE_EXCERPTS.length} / ${SAMPLE_EXCERPTS.length}`)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resolve all/i })).not.toBeInTheDocument()
    expect(screen.getByText(/No batch resolution or automatic recoding is available/)).toBeInTheDocument()
  })

  it('uses alternative-reading language for reflexive triage', async () => {
    const user = userEvent.setup()
    renderQueue('reflexive')

    await user.click(screen.getByRole('button', { name: 'Triage groups' }))

    const protectedGroup = screen.getByRole('heading', { name: 'Context, uncertainty & boundaries' }).closest('section')
    expect(protectedGroup).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Alternative readings' })).toBeInTheDocument()
    expect(screen.getByText(/invite closer human reading/)).toBeInTheDocument()
    expect(within(protectedGroup as HTMLElement).queryByText(/correct|incorrect|accuracy/i)).not.toBeInTheDocument()
  })

  it('returns to the same triage organisation after inspecting a case', async () => {
    const user = userEvent.setup()
    sessionStorage.removeItem(QUEUE_DISPLAY_SESSION_KEY)
    const reviews = runMockBlindReview(
      buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...INITIAL_STATE,
      view: 'queue',
      project: SAMPLE_PROJECT,
      codebook: SAMPLE_CODEBOOK,
      excerpts: SAMPLE_EXCERPTS,
      frozen: {
        frozenAt: '2026-07-22T09:30:00.000Z',
        project: SAMPLE_PROJECT,
        codebook: SAMPLE_CODEBOOK,
        humanCoding: SAMPLE_EXCERPTS,
      },
      reviews,
    }))
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Triage groups' }))
    await user.click(screen.getByRole('button', { name: /SYN-008/ }))
    expect(screen.getByRole('heading', { level: 1, name: /Review case SYN-008/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to review queue' }))
    expect(screen.getByRole('heading', { name: 'Every unresolved case stays visible.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Triage groups' })).toHaveAttribute('aria-pressed', 'true')
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(QUEUE_DISPLAY_SESSION_KEY)
  })
})
