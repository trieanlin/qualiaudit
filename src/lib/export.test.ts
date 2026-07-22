import { describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildAuditBundle, buildReviewedRows, reviewedRowsCsv } from './export'
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
    })

    expect(bundle.methodological_safeguards.ai_has_final_decision_authority).toBe(false)
    expect(bundle.methodological_safeguards.withheld_from_reviewer).toContain('human_code')
    expect(bundle.human_decisions_changed_after_ai_exposure).toHaveLength(1)
  })
})
