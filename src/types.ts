export type AnalysisMode = 'codebook' | 'reflexive'
export type Confidence = 'low' | 'medium' | 'high'
export type ReviewerMode = 'mock' | 'openai'

export interface ProjectBrief {
  id: string
  name: string
  researchQuestion: string
  analysisMode: AnalysisMode
  aiRole: string
  createdAt: string
}

export interface CodeDefinition {
  code: string
  definition: string
  include_when: string
  exclude_when: string
  example?: string
}

export interface HumanCodedExcerpt {
  excerpt_id: string
  source_id: string
  excerpt: string
  context?: string
  human_code: string
  human_rationale?: string
  human_confidence?: Confidence
  second_coder_code?: string
  second_coder_rationale?: string
}

export interface BlindExcerpt {
  excerpt_id: string
  source_id: string
  excerpt: string
  context?: string
}

export interface BlindReviewPayload {
  researchQuestion: string
  analysisMode: AnalysisMode
  aiRole: string
  codebook: CodeDefinition[]
  excerpts: BlindExcerpt[]
}

export interface ProviderConsent {
  version: 'qualiaudit-openai-consent-v0.2'
  provider: 'openai'
  grantedAt: string
  exactFields: string[]
}

export interface AiReview {
  excerpt_id: string
  primary_suggested_code: string
  alternative_code?: string
  evidence_quote: string
  rationale: string
  uncertainty: Confidence
  needs_more_context: boolean
  possible_codebook_issue?: string
  reviewer: 'deterministic-mock-v0.1' | 'openai-responses-v0.2'
  provider?: 'local-mock' | 'openai'
  model?: string
  prompt_version?: string
  schema_version?: string
  data_destination?: 'local-browser' | 'openai-api'
  consent_version?: ProviderConsent['version']
  request_id?: string
  provider_request_id?: string
  provider_response_id?: string
  reviewed_at: string
}

export type QueueCategory =
  | 'aligned'
  | 'partial'
  | 'different'
  | 'segment_boundary'
  | 'codebook_ambiguity'
  | 'insufficient_context'
  | 'human_low_confidence'
  | 'ai_low_confidence'
  | 'unsupported_or_invalid'

export type ResolutionDecision =
  | 'keep_original'
  | 'accept_ai'
  | 'keep_both'
  | 'revise_code'
  | 'revise_boundary'
  | 'revise_codebook'
  | 'discuss'
  | 'unresolved'
  | 'reject_ai'

export interface Resolution {
  excerpt_id: string
  decision: ResolutionDecision
  rationale: string
  final_code?: string
  decided_at: string
  changed_after_ai_exposure: boolean
}

export interface FrozenSnapshot {
  frozenAt: string
  project: ProjectBrief
  codebook: CodeDefinition[]
  humanCoding: HumanCodedExcerpt[]
}

export interface ValidationIssue {
  level: 'error' | 'warning'
  row?: number
  field?: string
  message: string
}

export type AppView = 'landing' | 'setup' | 'materials' | 'freeze' | 'reviewing' | 'queue' | 'case' | 'audit'
