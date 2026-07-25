import type { BlindReviewPayload, ProviderConsent } from '../types'

export const REVIEWER_CONSENT_VERSION: ProviderConsent['version'] = 'qualiaudit-openai-consent-v0.2'
export const OPENAI_REVIEWER_ID = 'openai-responses-v0.2' as const
export const OPENAI_PROMPT_VERSION = 'blind-review-v0.2' as const

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
