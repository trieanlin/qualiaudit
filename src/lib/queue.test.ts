import { describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildBlindReviewPayload, runMockBlindReview } from './reviewer'
import { categoryLabel, classifyCase } from './queue'

describe('method-aware comparison queue', () => {
  const reviews = runMockBlindReview(buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS))

  it('organises the synthetic sample into reflection-worthy comparison categories', () => {
    const categories = SAMPLE_EXCERPTS.map((human) => {
      const ai = reviews.find((item) => item.excerpt_id === human.excerpt_id)!
      return classifyCase(human, ai, SAMPLE_CODEBOOK)
    })

    expect(categories).toContain('aligned')
    expect(categories).toContain('partial')
    expect(categories).toContain('different')
    expect(categories).toContain('codebook_ambiguity')
    expect(categories).toContain('segment_boundary')
    expect(categories).toContain('insufficient_context')
  })

  it('uses interpretive rather than error language in reflexive mode', () => {
    expect(categoryLabel('different', 'reflexive')).toBe('Alternative reading')
    expect(categoryLabel('unsupported_or_invalid', 'reflexive')).toBe('Unsupported AI reading')
    expect(categoryLabel('different', 'codebook')).toBe('Different interpretation')
  })
})
