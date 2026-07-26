import type { AnalysisMode, QueueCategory } from '../types'

export type TriageBand =
  | 'protected_attention'
  | 'interpretive_divergence'
  | 'routine_overlap'
  | 'resolved'

export const PROTECTED_TRIAGE_CATEGORIES: readonly QueueCategory[] = [
  'unsupported_or_invalid',
  'insufficient_context',
  'human_low_confidence',
  'ai_low_confidence',
  'segment_boundary',
  'codebook_ambiguity',
]

export const TRIAGE_BAND_ORDER: readonly TriageBand[] = [
  'protected_attention',
  'interpretive_divergence',
  'routine_overlap',
  'resolved',
]

export function triageBandFor(category: QueueCategory, resolved: boolean): TriageBand {
  if (resolved) return 'resolved'
  if (PROTECTED_TRIAGE_CATEGORIES.includes(category)) return 'protected_attention'
  if (category === 'different' || category === 'partial') return 'interpretive_divergence'
  return 'routine_overlap'
}

const CODEBOOK_LABELS: Record<TriageBand, string> = {
  protected_attention: 'Protected attention',
  interpretive_divergence: 'Interpretation differences',
  routine_overlap: 'Routine overlap',
  resolved: 'Recorded decisions',
}

const REFLEXIVE_LABELS: Record<TriageBand, string> = {
  protected_attention: 'Context, uncertainty & boundaries',
  interpretive_divergence: 'Alternative readings',
  routine_overlap: 'Interpretive overlap',
  resolved: 'Recorded decisions',
}

const CODEBOOK_DESCRIPTIONS: Record<TriageBand, string> = {
  protected_attention: 'Always shown first: context, confidence, boundary, ambiguity, or unsupported-reading concerns need individual judgment.',
  interpretive_divergence: 'Different or partially overlapping readings to compare without treating either as ground truth.',
  routine_overlap: 'Direct code overlap. These cases remain visible and still require a human decision.',
  resolved: 'Cases with a recorded post-exposure decision. Triage never changes these decisions.',
}

const REFLEXIVE_DESCRIPTIONS: Record<TriageBand, string> = {
  protected_attention: 'Always shown first: tentative, contextual, conceptual, or boundary questions invite closer human reading.',
  interpretive_divergence: 'Alternative or related readings that may widen reflexive engagement.',
  routine_overlap: 'Interpretive overlap. These cases remain visible and still require a human decision.',
  resolved: 'Cases with a recorded post-exposure decision. Triage never changes these decisions.',
}

export function triageBandLabel(band: TriageBand, mode: AnalysisMode): string {
  return mode === 'reflexive' ? REFLEXIVE_LABELS[band] : CODEBOOK_LABELS[band]
}

export function triageBandDescription(band: TriageBand, mode: AnalysisMode): string {
  return mode === 'reflexive' ? REFLEXIVE_DESCRIPTIONS[band] : CODEBOOK_DESCRIPTIONS[band]
}
