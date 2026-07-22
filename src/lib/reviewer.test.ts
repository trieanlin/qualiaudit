import { describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildBlindReviewPayload, runMockBlindReview } from './reviewer'

describe('blind review boundary', () => {
  it('withholds every human interpretation field from the reviewer payload', () => {
    const payload = buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS)
    const serialized = JSON.stringify(payload)

    expect(Object.keys(payload.excerpts[0])).toEqual(['excerpt_id', 'source_id', 'excerpt', 'context'])
    expect(serialized).not.toContain('human_code')
    expect(serialized).not.toContain('human_rationale')
    expect(serialized).not.toContain('human_confidence')
    expect(serialized).not.toContain('second_coder')
  })

  it('returns structured, valid, deterministic readings for every excerpt', () => {
    const payload = buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS)
    const reviewedAt = '2026-07-22T10:00:00.000Z'
    const first = runMockBlindReview(payload, reviewedAt)
    const second = runMockBlindReview(payload, reviewedAt)
    const validCodes = new Set(SAMPLE_CODEBOOK.map((item) => item.code))

    expect(first).toEqual(second)
    expect(first).toHaveLength(SAMPLE_EXCERPTS.length)
    expect(first.every((item) => validCodes.has(item.primary_suggested_code))).toBe(true)
    expect(first.every((item) => item.evidence_quote.length > 0 && item.rationale.length > 0)).toBe(true)
  })
})
