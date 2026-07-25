import type { BlindReviewPayload, ProviderConsent } from '../types'
export {
  ACTIVE_REVIEWER_PROTOCOL,
  ACTIVE_REVIEWER_PROTOCOL_ID,
  OPENAI_PROMPT_VERSION,
  OPENAI_REVIEWER_ID,
  OPENAI_SCHEMA_VERSION,
  REVIEWER_PROTOCOL_REGISTRY,
} from './reviewerRegistry'

export const REVIEWER_CONSENT_VERSION: ProviderConsent['version'] = 'qualiaudit-openai-consent-v0.2'

export const REMOTE_REVIEW_EXACT_FIELDS = [
  'research question',
  'analysis mode',
  'intended role of AI',
  'codebook definitions and guidance',
  'excerpt ID and source ID',
  'excerpt text',
  'necessary context, when supplied',
] as const

export interface ReviewerProviderConfig {
  provider: 'OpenAI API'
  configured: boolean
  model: string | null
  region: string
  retention: string
  responsesStored: false
  consentVersion: typeof REVIEWER_CONSENT_VERSION
  promptVersion: string
  schemaVersion: string
  requestTimeoutMs: number
}

export interface RemoteReviewRequest {
  request_id: string
  consent: {
    granted: true
    version: typeof REVIEWER_CONSENT_VERSION
  }
  payload: BlindReviewPayload
}

export interface RemoteReviewResponse {
  reviews: import('../types').AiReview[]
}

export interface RemoteReviewErrorResponse {
  error: {
    code: string
    message: string
    retry_after_seconds?: number
    request_id?: string
    provider_request_id?: string
  }
}
