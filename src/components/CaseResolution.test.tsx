import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildBlindReviewPayload, runMockBlindReview } from '../lib/reviewer'
import { CaseResolution } from './CaseResolution'

describe('codebook change resolution', () => {
  it('presents the optional second-human record separately from the AI comparison', () => {
    const human = SAMPLE_EXCERPTS[1]
    const ai = runMockBlindReview(
      buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
    )[1]

    render(
      <CaseResolution
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        human={human}
        excerpts={SAMPLE_EXCERPTS}
        ai={ai}
        memos={[]}
        onBack={vi.fn()}
        onSave={vi.fn()}
        onAddMemo={vi.fn()}
      />,
    )

    const secondHumanHeading = screen.getByRole('heading', { name: 'A separate human comparison' })
    const secondHumanSection = secondHumanHeading.closest('section')
    expect(secondHumanSection).not.toBeNull()
    expect(within(secondHumanSection as HTMLElement).getByText('Different human interpretation')).toBeInTheDocument()
    expect(within(secondHumanSection as HTMLElement).getByText(/withheld from the AI reviewer/)).toBeInTheDocument()
    expect(screen.getByText('AI reading').closest('section')).not.toContainElement(secondHumanSection)
  })

  it('marks long unbroken code identifiers for safe wrapping in the comparison', () => {
    const longCode = 'SUSTAINED_ENGAGEMENT_WITH_HOME_SLEEP_MONITORING_DESPITE_CHANGING_DAILY_ROUTINES_FAMILY_EXPECTATIONS_TECHNICAL_INTERRUPTIONS_AND_UNCERTAIN_PERCEIVED_VALUE'
    const human = {
      ...SAMPLE_EXCERPTS[1],
      human_code: longCode,
      second_coder_code: '家庭反馈与个人隐私边界之间的协商',
    }
    const ai = runMockBlindReview(
      buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
    )[1]

    render(
      <CaseResolution
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        human={human}
        excerpts={[...SAMPLE_EXCERPTS, human]}
        ai={ai}
        memos={[]}
        onBack={vi.fn()}
        onSave={vi.fn()}
        onAddMemo={vi.fn()}
      />,
    )

    expect(screen.getAllByText(longCode)).not.toHaveLength(0)
    screen.getAllByText(longCode).forEach((identifier) => {
      expect(identifier).toHaveClass('code-identifier')
    })
    expect(screen.getByText('家庭反馈与个人隐私边界之间的协商')).toHaveClass('code-identifier')
  })

  it('records before/after guidance and unresolved recoding without changing the frozen codebook', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const human = SAMPLE_EXCERPTS.find((item) => item.excerpt_id === 'SYN-002')
    const ai = runMockBlindReview(
      buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
      '2026-07-25T08:45:00.000Z',
    ).find((item) => item.excerpt_id === 'SYN-002')
    if (!human || !ai) throw new Error('Missing sample case')
    const originalDefinition = SAMPLE_CODEBOOK.find((item) => item.code === 'FAMILY_FEEDBACK')?.definition

    render(
      <CaseResolution
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        human={human}
        excerpts={SAMPLE_EXCERPTS}
        ai={ai}
        memos={[]}
        onBack={vi.fn()}
        onSave={onSave}
        onAddMemo={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Revise codebook/ }))
    const frozenBefore = screen.getByText('FROZEN BEFORE').closest('article')
    expect(frozenBefore).not.toBeNull()
    expect(within(frozenBefore as HTMLElement).getByText(originalDefinition ?? '')).toBeInTheDocument()

    await user.clear(screen.getByRole('textbox', { name: /Definition Required/ }))
    await user.type(
      screen.getByRole('textbox', { name: /Definition Required/ }),
      'How welcomed, negotiated, or unwanted family feedback shapes engagement.',
    )
    await user.type(
      screen.getByPlaceholderText('What evidence or analytic consideration led to this decision?'),
      'The privacy boundary needs clearer guidance for family involvement.',
    )
    await user.click(screen.getByRole('button', { name: /Save decision/ }))

    expect(onSave).toHaveBeenCalledOnce()
    const [resolution, change] = onSave.mock.calls[0]
    expect(resolution).toMatchObject({
      excerpt_id: 'SYN-002',
      decision: 'revise_codebook',
      final_code: 'FAMILY_FEEDBACK',
      changed_after_ai_exposure: true,
    })
    expect(resolution.codebook_change_id).toBe(change.id)
    expect(change).toMatchObject({
      ledger_version: 'qualiaudit-codebook-change-v0.1',
      trigger_excerpt_id: 'SYN-002',
      code: 'FAMILY_FEEDBACK',
      author: 'Researcher',
    })
    expect(change.before.definition).toBe(originalDefinition)
    expect(change.after.definition).toContain('negotiated')
    expect(change.affected_excerpt_ids).toContain('SYN-002')
    expect(change.unresolved_recode_excerpt_ids).toEqual(change.affected_excerpt_ids)
    expect(SAMPLE_CODEBOOK.find((item) => item.code === 'FAMILY_FEEDBACK')?.definition)
      .toBe(originalDefinition)
  })

  it('requires a real codebook change before saving the ledger event', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const human = SAMPLE_EXCERPTS[1]
    const ai = runMockBlindReview(
      buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
    )[1]

    render(
      <CaseResolution
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        human={human}
        excerpts={SAMPLE_EXCERPTS}
        ai={ai}
        memos={[]}
        onBack={vi.fn()}
        onSave={onSave}
        onAddMemo={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Revise codebook/ }))
    await user.type(
      screen.getByPlaceholderText('What evidence or analytic consideration led to this decision?'),
      'The boundary needs clearer guidance.',
    )
    await user.click(screen.getByRole('button', { name: /Save decision/ }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/at least one real change/)).toBeInTheDocument()
  })

  it('adds an append-only researcher memo linked to an existing human decision', async () => {
    const user = userEvent.setup()
    const onAddMemo = vi.fn()
    const human = SAMPLE_EXCERPTS[1]
    const ai = runMockBlindReview(
      buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
    )[1]
    const existing = {
      excerpt_id: human.excerpt_id,
      decision: 'keep_both' as const,
      rationale: 'Both readings matter for the analytic question.',
      final_code: 'FAMILY_FEEDBACK + PRIVACY_BOUNDARY',
      decided_at: '2026-07-25T09:00:00.000Z',
      changed_after_ai_exposure: true,
    }

    render(
      <CaseResolution
        project={{ ...SAMPLE_PROJECT, analysisMode: 'reflexive' }}
        codebook={SAMPLE_CODEBOOK}
        human={human}
        excerpts={SAMPLE_EXCERPTS}
        ai={ai}
        existing={existing}
        memos={[]}
        onBack={vi.fn()}
        onSave={vi.fn()}
        onAddMemo={onAddMemo}
      />,
    )

    expect(screen.getByText(/never sent back to the AI reviewer/)).toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: /Reflexive memo/ }),
      'The comparison made privacy and family care feel analytically inseparable.',
    )
    await user.click(screen.getByRole('button', { name: 'Add memo' }))

    expect(onAddMemo).toHaveBeenCalledOnce()
    expect(onAddMemo.mock.calls[0][0]).toMatchObject({
      memo_version: 'qualiaudit-reflexive-memo-v0.1',
      excerpt_id: 'SYN-002',
      resolution_decided_at: existing.decided_at,
      decision: 'keep_both',
      author: 'Researcher',
      body: 'The comparison made privacy and family care feel analytically inseparable.',
    })
  })
})
