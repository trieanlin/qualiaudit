import { describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildAuditBundle, buildReviewedRows, downloadText, reviewedRowsCsv } from './export'
import { buildBlindReviewPayload, runMockBlindReview } from './reviewer'

describe('audit exports', () => {
  const reviews = runMockBlindReview(buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS))
  const resolution = {
    excerpt_id: 'SYN-002',
    decision: 'keep_both' as const,
    rationale: 'Both readings matter for the analytic question.',
    final_code: 'FAMILY_FEEDBACK + PRIVACY_BOUNDARY',
    decided_at: '2026-07-22T11:00:00.000Z',
    changed_after_ai_exposure: true,
  }
  const memo = {
    memo_version: 'qualiaudit-reflexive-memo-v0.1' as const,
    id: 'memo-syn-002',
    excerpt_id: 'SYN-002',
    resolution_decided_at: resolution.decided_at,
    decision: resolution.decision,
    author: 'Researcher',
    body: 'The disagreement made the privacy implications of family involvement more visible.',
    created_at: '2026-07-22T11:05:00.000Z',
  }

  it('keeps unresolved rows and resolved decisions in the reviewed coding table', () => {
    const rows = buildReviewedRows(SAMPLE_EXCERPTS, reviews, [resolution])
    expect(rows).toHaveLength(SAMPLE_EXCERPTS.length)
    expect(rows[1]).toMatchObject({ final_decision: 'keep_both', changed_after_ai_exposure: 'true' })
    expect(rows[0].final_decision).toBe('not_reviewed')
    expect(reviewedRowsCsv(rows)).toContain('FAMILY_FEEDBACK + PRIVACY_BOUNDARY')
  })

  it('documents the blind boundary and lack of AI decision authority', () => {
    const bundle = buildAuditBundle({
      project: SAMPLE_PROJECT,
      codebook: SAMPLE_CODEBOOK,
      excerpts: SAMPLE_EXCERPTS,
      frozen: { frozenAt: '2026-07-22T09:30:00.000Z', project: SAMPLE_PROJECT, codebook: SAMPLE_CODEBOOK, humanCoding: SAMPLE_EXCERPTS },
      reviews,
      resolutions: [resolution],
      reflexiveMemos: [memo],
      codebookChanges: [],
    })

    expect(bundle.methodological_safeguards.ai_has_final_decision_authority).toBe(false)
    expect(bundle.methodological_safeguards.withheld_from_reviewer).toContain('human_code')
    expect(bundle.methodological_safeguards.withheld_from_reviewer).toContain('reflexive_memos')
    expect(bundle.human_decisions_changed_after_ai_exposure).toHaveLength(1)
    expect(bundle.reflexive_memos).toEqual([memo])
    expect(bundle.reviewer.schema_version).toBe('mock-review-output-v0.1')
  })

  it('records reproducibility and provider support references for remote reviews', () => {
    const remoteReviews = reviews.map((review) => ({
      ...review,
      reviewer: 'openai-responses-v0.2' as const,
      provider: 'openai' as const,
      model: 'deployment-model',
      prompt_version: 'blind-review-v0.2',
      schema_version: 'blind-review-schema-v0.2',
      data_destination: 'openai-api' as const,
      consent_version: 'qualiaudit-openai-consent-v0.2' as const,
      request_id: 'qa-client-request',
      provider_request_id: 'provider-request',
      provider_response_id: 'resp_example',
    }))
    const bundle = buildAuditBundle({
      project: SAMPLE_PROJECT,
      codebook: SAMPLE_CODEBOOK,
      excerpts: SAMPLE_EXCERPTS,
      frozen: {
        frozenAt: '2026-07-22T09:30:00.000Z',
        project: SAMPLE_PROJECT,
        codebook: SAMPLE_CODEBOOK,
        humanCoding: SAMPLE_EXCERPTS,
      },
      reviews: remoteReviews,
      resolutions: [resolution],
      reflexiveMemos: [],
      codebookChanges: [],
    })

    expect(bundle.reviewer).toMatchObject({
      prompt_version: 'blind-review-v0.2',
      schema_version: 'blind-review-schema-v0.2',
      client_request_id: 'qa-client-request',
      provider_request_id: 'provider-request',
      provider_response_id: 'resp_example',
    })
  })

  it('exports a versioned codebook ledger and unresolved recoding work', () => {
    const before = SAMPLE_CODEBOOK.find((item) => item.code === 'FAMILY_FEEDBACK')
    if (!before) throw new Error('Missing sample code')
    const change = {
      ledger_version: 'qualiaudit-codebook-change-v0.1' as const,
      id: 'change-family-feedback',
      trigger_excerpt_id: 'SYN-002',
      code: 'FAMILY_FEEDBACK',
      before: { ...before },
      after: {
        ...before,
        definition: 'How welcomed, negotiated, or unwanted family feedback shapes engagement.',
      },
      author: 'Researcher',
      rationale: 'The boundary needs clearer guidance.',
      created_at: '2026-07-22T11:00:00.000Z',
      affected_excerpt_ids: ['SYN-002', 'SYN-007'],
      unresolved_recode_excerpt_ids: ['SYN-002', 'SYN-007'],
    }
    const bundle = buildAuditBundle({
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
      resolutions: [{
        ...resolution,
        decision: 'revise_codebook',
        final_code: 'FAMILY_FEEDBACK',
        codebook_change_id: change.id,
      }],
      reflexiveMemos: [],
      codebookChanges: [change],
    })

    expect(bundle.schema_version).toBe('qualiaudit-audit-v0.4')
    expect(bundle.codebook_change_ledger[0].before).toEqual(before)
    expect(bundle.codebook_change_ledger[0].after.definition).toContain('negotiated')
    expect(bundle.unresolved_recoding_work).toEqual([
      { codebook_change_id: change.id, code: 'FAMILY_FEEDBACK', excerpt_id: 'SYN-002' },
      { codebook_change_id: change.id, code: 'FAMILY_FEEDBACK', excerpt_id: 'SYN-007' },
    ])
  })

  it('creates a named browser download and releases its object URL', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn(() => 'blob:qualiaudit-test')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    downloadText('qualiaudit-audit.json', '{}', 'application/json')

    const anchor = click.mock.instances[0] as HTMLAnchorElement
    expect(click).toHaveBeenCalledOnce()
    expect(anchor.download).toBe('qualiaudit-audit.json')
    expect(anchor.href).toContain('blob:qualiaudit-test')
    expect(anchor.isConnected).toBe(false)
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:qualiaudit-test')

    click.mockRestore()
    vi.useRealTimers()
  })
})
