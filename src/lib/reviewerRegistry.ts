export const REVIEWER_PROTOCOL_REGISTRY = {
  'blind-review-v0.2': {
    reviewerId: 'openai-responses-v0.2',
    promptVersion: 'blind-review-v0.2',
    schemaVersion: 'blind-review-schema-v0.2',
    responseFormatName: 'qualiaudit_blind_reviews_v0_2',
    instructions: [
      'Act as an independent qualitative-coding reviewer, not as a final decision-maker.',
      'The human first-pass codes and rationales are deliberately absent. Do not infer or claim to know them.',
      'Return exactly one review for every excerpt ID and use only codes present in the supplied codebook.',
      'The evidence_quote must be a verbatim, non-empty substring of that excerpt.',
      'Represent uncertainty honestly. Flag missing context or possible codebook overlap when relevant.',
      'For reflexive thematic analysis, frame divergence as an alternative reading rather than an error or accuracy judgment.',
    ],
  },
} as const

export type ReviewerProtocolId = keyof typeof REVIEWER_PROTOCOL_REGISTRY

export const ACTIVE_REVIEWER_PROTOCOL_ID: ReviewerProtocolId = 'blind-review-v0.2'
export const ACTIVE_REVIEWER_PROTOCOL = REVIEWER_PROTOCOL_REGISTRY[ACTIVE_REVIEWER_PROTOCOL_ID]
export const OPENAI_REVIEWER_ID = ACTIVE_REVIEWER_PROTOCOL.reviewerId
export const OPENAI_PROMPT_VERSION = ACTIVE_REVIEWER_PROTOCOL.promptVersion
export const OPENAI_SCHEMA_VERSION = ACTIVE_REVIEWER_PROTOCOL.schemaVersion
