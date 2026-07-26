import { describe, expect, it } from 'vitest'
import { SAMPLE_EXCERPTS } from '../data/sample'
import {
  buildSecondCoderComparisons,
  secondCoderRelationshipLabel,
  summariseSecondCoderComparisons,
} from './secondCoder'

describe('second-human-coder comparison', () => {
  it('includes only excerpts with an optional second-human record', () => {
    const comparisons = buildSecondCoderComparisons(SAMPLE_EXCERPTS)

    expect(comparisons).toHaveLength(3)
    expect(comparisons[0]).toMatchObject({
      excerpt_id: 'SYN-001',
      first_coder_code: 'ROUTINE_FIT',
      second_coder_code: 'ROUTINE_FIT',
      relationship: 'same_code',
    })
    expect(comparisons[1]).toMatchObject({
      excerpt_id: 'SYN-002',
      relationship: 'different_code',
    })
  })

  it('summarises only the available second-human subset', () => {
    const summary = summariseSecondCoderComparisons(buildSecondCoderComparisons(SAMPLE_EXCERPTS))

    expect(summary).toEqual({ total: 3, sameCode: 1, differentCode: 2 })
  })

  it('uses method-sensitive language without correctness claims', () => {
    expect(secondCoderRelationshipLabel('different_code', 'codebook')).toBe('Different human interpretation')
    expect(secondCoderRelationshipLabel('different_code', 'reflexive')).toBe('Alternative human reading')
    expect(secondCoderRelationshipLabel('same_code', 'reflexive')).toBe('Interpretive overlap')
  })
})
