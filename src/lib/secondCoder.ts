import type { AnalysisMode, HumanCodedExcerpt } from '../types'

export type SecondCoderRelationship = 'same_code' | 'different_code'

export interface SecondCoderComparison {
  excerpt_id: string
  source_id: string
  first_coder_code: string
  second_coder_code: string
  second_coder_rationale: string
  relationship: SecondCoderRelationship
}

export interface SecondCoderSummary {
  total: number
  sameCode: number
  differentCode: number
}

export function buildSecondCoderComparisons(
  excerpts: HumanCodedExcerpt[],
): SecondCoderComparison[] {
  return excerpts.flatMap((excerpt) => {
    const secondCoderCode = excerpt.second_coder_code?.trim()
    if (!secondCoderCode) return []
    return [{
      excerpt_id: excerpt.excerpt_id,
      source_id: excerpt.source_id,
      first_coder_code: excerpt.human_code,
      second_coder_code: secondCoderCode,
      second_coder_rationale: excerpt.second_coder_rationale?.trim() ?? '',
      relationship: secondCoderCode === excerpt.human_code ? 'same_code' as const : 'different_code' as const,
    }]
  })
}

export function summariseSecondCoderComparisons(
  comparisons: SecondCoderComparison[],
): SecondCoderSummary {
  const sameCode = comparisons.filter((comparison) => comparison.relationship === 'same_code').length
  return {
    total: comparisons.length,
    sameCode,
    differentCode: comparisons.length - sameCode,
  }
}

export function secondCoderRelationshipLabel(
  relationship: SecondCoderRelationship,
  mode: AnalysisMode,
): string {
  if (relationship === 'same_code') {
    return mode === 'reflexive' ? 'Interpretive overlap' : 'Direct human overlap'
  }
  return mode === 'reflexive' ? 'Alternative human reading' : 'Different human interpretation'
}
