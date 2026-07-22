import type { AiReview, AnalysisMode, CodeDefinition, HumanCodedExcerpt, QueueCategory } from '../types'

export function classifyCase(
  human: HumanCodedExcerpt,
  ai: AiReview,
  codebook: CodeDefinition[],
): QueueCategory {
  const validCodes = new Set(codebook.map((item) => item.code))
  if (!validCodes.has(ai.primary_suggested_code)) return 'unsupported_or_invalid'
  if (ai.possible_codebook_issue?.toLowerCase().startsWith('segment boundary')) return 'segment_boundary'
  if (ai.possible_codebook_issue) return 'codebook_ambiguity'
  if (ai.needs_more_context) return 'insufficient_context'
  if (human.human_confidence === 'low') return 'human_low_confidence'
  if (ai.uncertainty === 'high') return 'ai_low_confidence'
  if (ai.primary_suggested_code === human.human_code) return 'aligned'
  if (ai.alternative_code === human.human_code) return 'partial'
  return 'different'
}

const CODEBOOK_LABELS: Record<QueueCategory, string> = {
  aligned: 'Aligned',
  partial: 'Partial agreement',
  different: 'Different interpretation',
  segment_boundary: 'Possible segment-boundary issue',
  codebook_ambiguity: 'Possible codebook ambiguity',
  insufficient_context: 'Insufficient context',
  human_low_confidence: 'Human low-confidence',
  ai_low_confidence: 'AI low-confidence',
  unsupported_or_invalid: 'AI suggestion unsupported or invalid',
}

const REFLEXIVE_LABELS: Record<QueueCategory, string> = {
  aligned: 'Interpretive overlap',
  partial: 'Related readings',
  different: 'Alternative reading',
  segment_boundary: 'Possible segment-boundary question',
  codebook_ambiguity: 'Possible conceptual overlap',
  insufficient_context: 'More context invited',
  human_low_confidence: 'Tentative human reading',
  ai_low_confidence: 'Tentative AI reading',
  unsupported_or_invalid: 'Unsupported AI reading',
}

export function categoryLabel(category: QueueCategory, mode: AnalysisMode): string {
  return mode === 'reflexive' ? REFLEXIVE_LABELS[category] : CODEBOOK_LABELS[category]
}

export const QUEUE_ORDER: QueueCategory[] = [
  'different',
  'partial',
  'codebook_ambiguity',
  'segment_boundary',
  'insufficient_context',
  'human_low_confidence',
  'ai_low_confidence',
  'unsupported_or_invalid',
  'aligned',
]
