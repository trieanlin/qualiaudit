import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { INITIAL_STATE, STORAGE_KEY } from '../hooks/useReviewState'
import { buildBlindReviewPayload, runMockBlindReview } from '../lib/reviewer'
import { CaseResolution } from './CaseResolution'
import { Reviewing } from './FreezeReview'
import { Landing } from './Landing'
import { LocalDataDialog } from './LocalDataDialog'
import { Materials } from './Materials'

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom cannot calculate rendered colours; contrast is checked in browser QA.
      'color-contrast': { enabled: false },
    },
  })
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([])
}

function sampleReview() {
  return runMockBlindReview(
    buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
    '2026-07-26T10:00:00.000Z',
  )
}

describe('automated accessibility checks', () => {
  it('finds no detectable violations on the landing page', async () => {
    const { container } = render(
      <Landing
        onOpenSample={vi.fn()}
        onNewReview={vi.fn()}
        onRestoreProject={vi.fn()}
        onManageData={vi.fn()}
      />,
    )
    await expectNoAxeViolations(container)
  })

  it('finds no detectable violations in review materials', async () => {
    const { container } = render(
      <Materials
        codebook={SAMPLE_CODEBOOK}
        excerpts={SAMPLE_EXCERPTS}
        onChangeCodebook={vi.fn()}
        onChangeExcerpts={vi.fn()}
        onContinue={vi.fn()}
      />,
    )
    await expectNoAxeViolations(container)
  })

  it('finds no detectable violations in a case resolution', async () => {
    const reviews = sampleReview()
    const { container } = render(
      <CaseResolution
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        human={SAMPLE_EXCERPTS[1]}
        excerpts={SAMPLE_EXCERPTS}
        ai={reviews[1]}
        onBack={vi.fn()}
        onSave={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: /Review case SYN-002/ })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('finds no detectable violations in the local-data dialog', async () => {
    const { container } = render(
      <LocalDataDialog
        state={{
          ...INITIAL_STATE,
          view: 'materials',
          project: SAMPLE_PROJECT,
          codebook: SAMPLE_CODEBOOK,
          excerpts: SAMPLE_EXCERPTS,
        }}
        onClose={vi.fn()}
        onSaveProject={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    await expectNoAxeViolations(container)
  })
})

describe('keyboard and focus behaviour', () => {
  it('does not steal initial focus and focuses headings after in-app navigation', async () => {
    localStorage.removeItem(STORAGE_KEY)
    const user = userEvent.setup()
    render(<App />)

    const landingHeading = screen.getByRole('heading', { level: 1 })
    expect(landingHeading).not.toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'QualiAudit home' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: /Open synthetic review/ }))
    await waitFor(() => expect(
      screen.getByRole('heading', { level: 1, name: 'Inspect the record that will be frozen.' }),
    ).toHaveFocus())
    localStorage.removeItem(STORAGE_KEY)
  })

  it('exposes determinate progress without repeatedly announcing the whole page', () => {
    render(
      <Reviewing
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        excerpts={SAMPLE_EXCERPTS}
        reviewerMode="mock"
        consent={null}
        requestId="test-request"
        remoteRequestStarted={false}
        onRemoteStart={vi.fn()}
        onPrepareRetry={vi.fn()}
        onUseLocalFallback={vi.fn()}
        onDone={vi.fn()}
      />,
    )

    const progress = screen.getByRole('progressbar', { name: 'Independent review progress' })
    expect(progress).toHaveAttribute('aria-valuemin', '0')
    expect(progress).toHaveAttribute('aria-valuemax', String(SAMPLE_EXCERPTS.length))
    expect(progress).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByText('Creating a separate reading.').closest('[aria-live]')).toBeNull()
  })

  it('supports arrow-key navigation across review-material tabs', async () => {
    const user = userEvent.setup()
    render(
      <Materials
        codebook={SAMPLE_CODEBOOK}
        excerpts={SAMPLE_EXCERPTS}
        onChangeCodebook={vi.fn()}
        onChangeExcerpts={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    const codebookTab = screen.getByRole('tab', { name: /Codebook/ })
    const codingTab = screen.getByRole('tab', { name: /Human-coded excerpts/ })
    codebookTab.focus()
    await user.keyboard('{ArrowRight}')

    expect(codingTab).toHaveFocus()
    expect(codingTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/Human-coded excerpts/)

    await user.keyboard('{Home}')
    expect(codebookTab).toHaveFocus()
    expect(codebookTab).toHaveAttribute('aria-selected', 'true')
  })

  it('supports radio-style arrow navigation and focuses validation errors', async () => {
    const user = userEvent.setup()
    const reviews = sampleReview()
    render(
      <CaseResolution
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        human={SAMPLE_EXCERPTS[1]}
        excerpts={SAMPLE_EXCERPTS}
        ai={reviews[1]}
        onBack={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    const firstDecision = screen.getByRole('radio', { name: /Keep original interpretation/ })
    firstDecision.focus()
    await user.keyboard('{ArrowRight}')
    const secondDecision = screen.getByRole('radio', { name: /Accept AI suggestion/ })
    expect(secondDecision).toHaveFocus()
    expect(secondDecision).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('button', { name: /Save decision/ }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus())
  })

  it('traps dialog focus, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup()

    function DialogHarness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Manage local data</button>
          {open && (
            <LocalDataDialog
              state={{
                ...INITIAL_STATE,
                view: 'materials',
                project: SAMPLE_PROJECT,
                codebook: SAMPLE_CODEBOOK,
                excerpts: SAMPLE_EXCERPTS,
              }}
              onClose={() => setOpen(false)}
              onSaveProject={vi.fn()}
              onClear={vi.fn()}
            />
          )}
        </>
      )
    }

    render(<DialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Manage local data' })
    await user.click(trigger)

    const close = screen.getByRole('button', { name: 'Close local data dialog' })
    await waitFor(() => expect(close).toHaveFocus())

    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: /Delete local review/ })).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
