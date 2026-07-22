import type {
  AiReview,
  BlindReviewPayload,
  CodeDefinition,
  HumanCodedExcerpt,
  ProjectBrief,
} from '../types'

export function buildBlindReviewPayload(
  project: ProjectBrief,
  codebook: CodeDefinition[],
  humanCoding: HumanCodedExcerpt[],
): BlindReviewPayload {
  return {
    researchQuestion: project.researchQuestion,
    analysisMode: project.analysisMode,
    aiRole: project.aiRole,
    codebook: codebook.map((item) => ({ ...item })),
    excerpts: humanCoding.map(({ excerpt_id, source_id, excerpt, context }) => ({
      excerpt_id,
      source_id,
      excerpt,
      ...(context ? { context } : {}),
    })),
  }
}

function quote(text: string, phrase: string): string {
  const start = text.toLowerCase().indexOf(phrase.toLowerCase())
  if (start === -1) return text.length > 92 ? `${text.slice(0, 89)}…` : text
  return text.slice(start, Math.min(text.length, start + 92))
}

export function runMockBlindReview(payload: BlindReviewPayload, reviewedAt = new Date().toISOString()): AiReview[] {
  const validCodes = new Set(payload.codebook.map((item) => item.code))

  return payload.excerpts.map((item) => {
    const text = item.excerpt.toLowerCase()
    let primary = 'PERCEIVED_VALUE'
    let alternative: string | undefined
    let evidence = quote(item.excerpt, 'useful')
    let rationale = 'The excerpt evaluates whether continued monitoring has meaningful or practical value.'
    let uncertainty: AiReview['uncertainty'] = 'medium'
    let needsMoreContext = false
    let issue: string | undefined

    if (text.includes('charger') || text.includes('kettle') || text.includes('part of')) {
      primary = 'ROUTINE_FIT'
      evidence = quote(item.excerpt, 'part of')
      rationale = 'The speaker makes monitoring sustainable by linking it to an established domestic routine.'
      uncertainty = 'low'
    } else if (text.includes('red light')) {
      primary = 'TECHNICAL_FRICTION'
      evidence = quote(item.excerpt, 'red light')
      rationale = 'An unclear device state produces uncertainty and a concrete interruption in use.'
      uncertainty = 'low'
    } else if (text.includes('nurse explained')) {
      primary = 'PERCEIVED_VALUE'
      evidence = quote(item.excerpt, 'nurse explained')
      rationale = 'Interpretive support makes the data actionable and changes the case for continued use.'
      uncertainty = 'low'
    } else if (text.includes('guest room')) {
      primary = 'PRIVACY_BOUNDARY'
      evidence = quote(item.excerpt, 'did not want the questions')
      rationale = 'The speaker pauses use to manage what another person may notice or ask, while also describing a changed domestic situation.'
      uncertainty = 'medium'
    } else if (text.includes('feel as though i was being checked up on')) {
      primary = 'PRIVACY_BOUNDARY'
      alternative = 'FAMILY_FEEDBACK'
      evidence = quote(item.excerpt, 'being checked up on')
      rationale = 'The excerpt makes family involvement visible but centres discomfort with monitoring by another person.'
      uncertainty = 'medium'
    } else if (text.includes('wife kept asking') || text.includes('being watched')) {
      primary = 'PRIVACY_BOUNDARY'
      alternative = 'FAMILY_FEEDBACK'
      evidence = quote(item.excerpt, 'reassuring')
      rationale = 'The account sustains two plausible readings: supportive prompting and unwanted observation.'
      uncertainty = 'medium'
      issue = 'Possible overlap between FAMILY_FEEDBACK and PRIVACY_BOUNDARY when the same involvement is both supportive and intrusive.'
    } else if (text.includes('not sure what it means')) {
      primary = 'PERCEIVED_VALUE'
      evidence = item.excerpt
      rationale = 'A value-related reading is possible, but the missing referent prevents a well-supported interpretation.'
      uncertainty = 'high'
      needsMoreContext = true
    } else if (text.includes('battery failed')) {
      primary = 'TECHNICAL_FRICTION'
      evidence = quote(item.excerpt, 'battery failed')
      rationale = 'Battery failure suggests technical friction, but the deictic phrase cannot be interpreted independently.'
      uncertainty = 'high'
      needsMoreContext = true
      issue = 'Segment boundary: include the preceding turn so the referent of “that” can be reviewed.'
    }

    if (!validCodes.has(primary)) {
      primary = payload.codebook[0]?.code ?? 'NO_VALID_CODE'
      uncertainty = 'high'
      issue = 'The reviewer could not map its reading to a valid codebook entry.'
    }

    return {
      excerpt_id: item.excerpt_id,
      primary_suggested_code: primary,
      ...(alternative && validCodes.has(alternative) ? { alternative_code: alternative } : {}),
      evidence_quote: evidence,
      rationale,
      uncertainty,
      needs_more_context: needsMoreContext,
      ...(issue ? { possible_codebook_issue: issue } : {}),
      reviewer: 'deterministic-mock-v0.1',
      reviewed_at: reviewedAt,
    }
  })
}
