import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildBlindReviewPayload, runMockBlindReview } from '../lib/reviewer'
import { CaseResolution } from './CaseResolution'

describe('codebook change resolution', () => {
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
        onBack={vi.fn()}
        onSave={onSave}
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
        onBack={vi.fn()}
        onSave={onSave}
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
})
