import type {
  AiReview,
  CodebookChange,
  CodeDefinition,
  FrozenSnapshot,
  HumanCodedExcerpt,
  ProjectBrief,
  Resolution,
} from '../types'
import { toCsv } from './csv'

export interface ReviewedCodingRow {
  excerpt_id: string
  source_id: string
  excerpt: string
  human_code: string
  ai_suggested_code: string
  ai_alternative_code: string
  ai_uncertainty: string
  final_decision: string
  final_code: string
  resolution_rationale: string
  changed_after_ai_exposure: string
  decided_at: string
}

export function buildReviewedRows(
  excerpts: HumanCodedExcerpt[],
  reviews: AiReview[],
  resolutions: Resolution[],
): ReviewedCodingRow[] {
  return excerpts.map((human) => {
    const ai = reviews.find((item) => item.excerpt_id === human.excerpt_id)
    const resolution = resolutions.find((item) => item.excerpt_id === human.excerpt_id)
    return {
      excerpt_id: human.excerpt_id,
      source_id: human.source_id,
      excerpt: human.excerpt,
      human_code: human.human_code,
      ai_suggested_code: ai?.primary_suggested_code ?? '',
      ai_alternative_code: ai?.alternative_code ?? '',
      ai_uncertainty: ai?.uncertainty ?? '',
      final_decision: resolution?.decision ?? 'not_reviewed',
      final_code: resolution?.final_code ?? human.human_code,
      resolution_rationale: resolution?.rationale ?? '',
      changed_after_ai_exposure: resolution ? String(resolution.changed_after_ai_exposure) : '',
      decided_at: resolution?.decided_at ?? '',
    }
  })
}

export function reviewedRowsCsv(rows: ReviewedCodingRow[]): string {
  return toCsv(rows, [
    'excerpt_id',
    'source_id',
    'excerpt',
    'human_code',
    'ai_suggested_code',
    'ai_alternative_code',
    'ai_uncertainty',
    'final_decision',
    'final_code',
    'resolution_rationale',
    'changed_after_ai_exposure',
    'decided_at',
  ])
}

export function buildAuditBundle(args: {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  frozen: FrozenSnapshot
  reviews: AiReview[]
  resolutions: Resolution[]
  codebookChanges: CodebookChange[]
}) {
  const { project, codebook, excerpts, frozen, reviews, resolutions, codebookChanges } = args
  const firstReview = reviews[0]
  const usedOpenAi = firstReview?.provider === 'openai'
  return {
    schema_version: 'qualiaudit-audit-v0.3',
    exported_at: new Date().toISOString(),
    project,
    methodological_safeguards: {
      human_interpretation_frozen_at: frozen.frozenAt,
      blind_review_fields: ['researchQuestion', 'analysisMode', 'aiRole', 'codebook', 'excerpt', 'necessary context'],
      withheld_from_reviewer: [
        'human_code',
        'human_rationale',
        'human_confidence',
        'second_coder_code',
        'second_coder_rationale',
        'final_decision',
      ],
      ai_has_final_decision_authority: false,
    },
    reviewer: {
      provider: usedOpenAi ? 'OpenAI API via QualiAudit server endpoint' : 'local deterministic mock — no data sent to a third party',
      model: firstReview?.model ?? firstReview?.reviewer ?? 'not run',
      reviewer_adapter: firstReview?.reviewer ?? 'not run',
      prompt_version: firstReview?.prompt_version ?? (usedOpenAi ? 'not recorded' : 'mock-rules-v0.1'),
      schema_version: firstReview?.schema_version ?? (usedOpenAi ? 'not recorded' : 'mock-review-output-v0.1'),
      analysis_date: firstReview?.reviewed_at ?? null,
      data_destination: firstReview?.data_destination ?? (usedOpenAi ? 'openai-api' : 'local-browser'),
      transmission_consent_version: firstReview?.consent_version ?? null,
      responses_store_requested: usedOpenAi ? false : null,
      client_request_id: firstReview?.request_id ?? null,
      provider_request_id: firstReview?.provider_request_id ?? null,
      provider_response_id: firstReview?.provider_response_id ?? null,
    },
    codebook,
    reviewed_coding_table: buildReviewedRows(excerpts, reviews, resolutions),
    ai_reviews: reviews,
    decision_log: resolutions,
    codebook_change_ledger: codebookChanges,
    unresolved_recoding_work: codebookChanges.flatMap((change) => (
      change.unresolved_recode_excerpt_ids.map((excerptId) => ({
        codebook_change_id: change.id,
        code: change.code,
        excerpt_id: excerptId,
      }))
    )),
    unresolved_cases: resolutions.filter((item) => item.decision === 'unresolved'),
    human_decisions_changed_after_ai_exposure: resolutions.filter((item) => item.changed_after_ai_exposure),
  }
}

export function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
