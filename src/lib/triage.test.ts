import { describe, expect, it } from 'vitest'
import type { QueueCategory } from '../types'
import {
  PROTECTED_TRIAGE_CATEGORIES,
  TRIAGE_BAND_ORDER,
  triageBandDescription,
  triageBandFor,
  triageBandLabel,
} from './triage'

const ALL_CATEGORIES: QueueCategory[] = [
  'aligned',
  'partial',
  'different',
  'segment_boundary',
  'codebook_ambiguity',
  'insufficient_context',
  'human_low_confidence',
  'ai_low_confidence',
  'unsupported_or_invalid',
]

describe('safe queue triage', () => {
  it('protects every unresolved context, confidence, boundary, ambiguity, or support concern', () => {
    expect(PROTECTED_TRIAGE_CATEGORIES).toHaveLength(6)
    for (const category of PROTECTED_TRIAGE_CATEGORIES) {
      expect(triageBandFor(category, false)).toBe('protected_attention')
    }
  })

  it('keeps every unresolved queue category in an explicit triage band', () => {
    const grouped = ALL_CATEGORIES.map((category) => triageBandFor(category, false))
    expect(grouped).toHaveLength(ALL_CATEGORIES.length)
    expect(grouped.every((band) => TRIAGE_BAND_ORDER.includes(band))).toBe(true)
    expect(triageBandFor('different', false)).toBe('interpretive_divergence')
    expect(triageBandFor('partial', false)).toBe('interpretive_divergence')
    expect(triageBandFor('aligned', false)).toBe('routine_overlap')
  })

  it('moves only already-resolved cases into the recorded-decision band', () => {
    for (const category of ALL_CATEGORIES) {
      expect(triageBandFor(category, true)).toBe('resolved')
    }
  })

  it('uses method-aware language without accuracy or error claims', () => {
    expect(triageBandLabel('interpretive_divergence', 'reflexive')).toBe('Alternative readings')
    expect(triageBandDescription('protected_attention', 'reflexive')).toContain('closer human reading')
    expect(triageBandDescription('protected_attention', 'reflexive')).not.toMatch(/accuracy|correct|error/i)
  })
})
