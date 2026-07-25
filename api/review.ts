import {
  OPENAI_PROMPT_VERSION,
  OPENAI_REVIEWER_ID,
  REVIEWER_CONSENT_VERSION,
  type RemoteReviewRequest,
  type ReviewerProviderConfig,
} from '../src/lib/reviewerProtocol'
import type { AiReview, BlindReviewPayload, CodeDefinition, Confidence } from '../src/types'

interface ApiRequest {
  method?: string
  body?: unknown
}

interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

interface ProviderReview {
  excerpt_id: string
  primary_suggested_code: string
  alternative_code: string | null
  evidence_quote: string
  rationale: string
  uncertainty: Confidence
  needs_more_context: boolean
  possible_codebook_issue: string | null
}

const MAX_EXCERPTS_PER_REQUEST = 50
const MAX_CODEBOOK_ROWS = 300
const MAX_SERIALISED_PAYLOAD_BYTES = 120_000
const CONFIDENCE_VALUES = new Set<Confidence>(['low', 'medium', 'high'])

class RequestValidationError extends Error {
  code: string
  status: number

  constructor(message: string, code = 'invalid_request', status = 400) {
    super(message)
    this.name = 'RequestValidationError'
    this.code = code
    this.status = status
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestValidationError(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function stringValue(value: unknown, label: string, maximum: number, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > maximum || (!allowEmpty && value.trim().length === 0)) {
    throw new RequestValidationError(`${label} is missing or exceeds the allowed length.`)
  }
  return value
}

function optionalString(value: unknown, label: string, maximum: number): string | undefined {
  if (value == null || value === '') return undefined
  return stringValue(value, label, maximum)
}

function sanitiseCodebook(value: unknown): CodeDefinition[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_CODEBOOK_ROWS) {
    throw new RequestValidationError(`Codebook must contain 1–${MAX_CODEBOOK_ROWS} rows.`)
  }
  return value.map((row, index) => {
    const item = record(row, `Codebook row ${index + 1}`)
    return {
      code: stringValue(item.code, `Codebook row ${index + 1} code`, 160),
      definition: stringValue(item.definition, `Codebook row ${index + 1} definition`, 4_000, true),
      include_when: stringValue(item.include_when, `Codebook row ${index + 1} include_when`, 4_000, true),
      exclude_when: stringValue(item.exclude_when, `Codebook row ${index + 1} exclude_when`, 4_000, true),
      ...(optionalString(item.example, `Codebook row ${index + 1} example`, 4_000)
        ? { example: optionalString(item.example, `Codebook row ${index + 1} example`, 4_000) }
        : {}),
    }
  })
}

export function sanitiseBlindReviewPayload(value: unknown): BlindReviewPayload {
  const source = record(value, 'Blind review payload')
  const analysisMode = stringValue(source.analysisMode, 'Analysis mode', 32)
  if (analysisMode !== 'codebook' && analysisMode !== 'reflexive') {
    throw new RequestValidationError('Analysis mode is not supported.')
  }
  if (!Array.isArray(source.excerpts) || source.excerpts.length === 0 || source.excerpts.length > MAX_EXCERPTS_PER_REQUEST) {
    throw new RequestValidationError(`Review must contain 1–${MAX_EXCERPTS_PER_REQUEST} excerpts.`)
  }
  const payload: BlindReviewPayload = {
    researchQuestion: stringValue(source.researchQuestion, 'Research question', 8_000),
    analysisMode,
    aiRole: stringValue(source.aiRole, 'Intended role of AI', 4_000),
    codebook: sanitiseCodebook(source.codebook),
    excerpts: source.excerpts.map((row, index) => {
      const item = record(row, `Excerpt ${index + 1}`)
      return {
        excerpt_id: stringValue(item.excerpt_id, `Excerpt ${index + 1} ID`, 240),
        source_id: stringValue(item.source_id, `Excerpt ${index + 1} source ID`, 240),
        excerpt: stringValue(item.excerpt, `Excerpt ${index + 1} text`, 12_000),
        ...(optionalString(item.context, `Excerpt ${index + 1} context`, 8_000)
          ? { context: optionalString(item.context, `Excerpt ${index + 1} context`, 8_000) }
          : {}),
      }
    }),
  }
  if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > MAX_SERIALISED_PAYLOAD_BYTES) {
    throw new RequestValidationError('Blind review payload is too large.', 'payload_too_large', 413)
  }
  const codeIds = payload.codebook.map((item) => item.code)
  const excerptIds = payload.excerpts.map((item) => item.excerpt_id)
  if (new Set(codeIds).size !== codeIds.length) throw new RequestValidationError('Codebook codes must be unique.')
  if (new Set(excerptIds).size !== excerptIds.length) throw new RequestValidationError('Excerpt IDs must be unique.')
  return payload
}

export function parseRemoteReviewRequest(value: unknown): {
  requestId: string
  payload: BlindReviewPayload
} {
  const source = record(value, 'Request')
  if (!source.consent) {
    throw new RequestValidationError('Explicit provider consent is required.', 'consent_required')
  }
  const consent = record(source.consent, 'Consent')
  if (consent.granted !== true || consent.version !== REVIEWER_CONSENT_VERSION) {
    throw new RequestValidationError('Explicit provider consent is required.', 'consent_required')
  }
  return {
    requestId: stringValue(source.request_id, 'Request ID', 120),
    payload: sanitiseBlindReviewPayload(source.payload),
  }
}

function providerConfig(): ReviewerProviderConfig {
  const model = process.env.OPENAI_MODEL?.trim() || null
  const explicitlyEnabled = process.env.QUALIAUDIT_ENABLE_REMOTE_REVIEW === 'true'
  return {
    provider: 'OpenAI API',
    configured: Boolean(explicitlyEnabled && process.env.OPENAI_API_KEY?.trim() && model),
    model,
    region: process.env.QUALIAUDIT_OPENAI_REGION?.trim() || 'Not specified by this deployment',
    retention: 'store=false; default abuse-monitoring logs may retain content for up to 30 days unless approved data controls apply',
    responsesStored: false,
    consentVersion: REVIEWER_CONSENT_VERSION,
  }
}

function responseSchema(payload: BlindReviewPayload) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      reviews: {
        type: 'array',
        minItems: payload.excerpts.length,
        maxItems: payload.excerpts.length,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            excerpt_id: { type: 'string', enum: payload.excerpts.map((item) => item.excerpt_id) },
            primary_suggested_code: { type: 'string', enum: payload.codebook.map((item) => item.code) },
            alternative_code: {
              anyOf: [
                { type: 'string', enum: payload.codebook.map((item) => item.code) },
                { type: 'null' },
              ],
            },
            evidence_quote: { type: 'string' },
            rationale: { type: 'string' },
            uncertainty: { type: 'string', enum: ['low', 'medium', 'high'] },
            needs_more_context: { type: 'boolean' },
            possible_codebook_issue: { type: ['string', 'null'] },
          },
          required: [
            'excerpt_id',
            'primary_suggested_code',
            'alternative_code',
            'evidence_quote',
            'rationale',
            'uncertainty',
            'needs_more_context',
            'possible_codebook_issue',
          ],
        },
      },
    },
    required: ['reviews'],
  }
}

export function buildOpenAIRequestBody(payload: BlindReviewPayload) {
  return {
    model: process.env.OPENAI_MODEL,
    store: false,
    instructions: [
      'Act as an independent qualitative-coding reviewer, not as a final decision-maker.',
      'The human first-pass codes and rationales are deliberately absent. Do not infer or claim to know them.',
      'Return exactly one review for every excerpt ID and use only codes present in the supplied codebook.',
      'The evidence_quote must be a verbatim, non-empty substring of that excerpt.',
      'Represent uncertainty honestly. Flag missing context or possible codebook overlap when relevant.',
      'For reflexive thematic analysis, frame divergence as an alternative reading rather than an error or accuracy judgment.',
    ].join(' '),
    input: JSON.stringify(payload),
    text: {
      format: {
        type: 'json_schema',
        name: 'qualiaudit_blind_reviews',
        description: 'Independent excerpt-level qualitative coding reviews.',
        strict: true,
        schema: responseSchema(payload),
      },
    },
    max_output_tokens: Math.min(12_000, Math.max(2_000, payload.excerpts.length * 700)),
  }
}

function outputText(value: unknown): string {
  const response = record(value, 'Provider response')
  if (typeof response.output_text === 'string') return response.output_text
  if (!Array.isArray(response.output)) throw new RequestValidationError('Provider returned no structured output.', 'invalid_provider_output', 502)
  for (const itemValue of response.output) {
    if (!itemValue || typeof itemValue !== 'object') continue
    const item = itemValue as { content?: unknown }
    if (!Array.isArray(item.content)) continue
    for (const contentValue of item.content) {
      if (!contentValue || typeof contentValue !== 'object') continue
      const content = contentValue as { type?: unknown; text?: unknown }
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }
  throw new RequestValidationError('Provider returned no structured output.', 'invalid_provider_output', 502)
}

export function validateProviderReviews(
  value: unknown,
  payload: BlindReviewPayload,
  reviewedAt: string,
  model: string,
): AiReview[] {
  const source = record(value, 'Structured provider output')
  if (!Array.isArray(source.reviews) || source.reviews.length !== payload.excerpts.length) {
    throw new RequestValidationError('Provider did not return one review per excerpt.', 'invalid_provider_output', 502)
  }
  const validCodes = new Set(payload.codebook.map((item) => item.code))
  const excerpts = new Map(payload.excerpts.map((item) => [item.excerpt_id, item]))
  const seen = new Set<string>()
  const reviews = source.reviews.map((row, index): AiReview => {
    const item = record(row, `Provider review ${index + 1}`) as Partial<ProviderReview> & Record<string, unknown>
    const excerptId = stringValue(item.excerpt_id, `Provider review ${index + 1} excerpt ID`, 240)
    const excerpt = excerpts.get(excerptId)
    if (!excerpt || seen.has(excerptId)) {
      throw new RequestValidationError('Provider returned an unknown or duplicate excerpt ID.', 'invalid_provider_output', 502)
    }
    seen.add(excerptId)
    const primary = stringValue(item.primary_suggested_code, `Provider review ${index + 1} primary code`, 160)
    const alternative = optionalString(item.alternative_code, `Provider review ${index + 1} alternative code`, 160)
    if (!validCodes.has(primary) || (alternative && !validCodes.has(alternative))) {
      throw new RequestValidationError('Provider returned a code outside the codebook.', 'invalid_provider_output', 502)
    }
    const evidence = stringValue(item.evidence_quote, `Provider review ${index + 1} evidence quote`, 12_000)
    if (!excerpt.excerpt.includes(evidence)) {
      throw new RequestValidationError('Provider evidence is not a verbatim excerpt quote.', 'invalid_provider_output', 502)
    }
    const uncertainty = stringValue(item.uncertainty, `Provider review ${index + 1} uncertainty`, 16) as Confidence
    if (!CONFIDENCE_VALUES.has(uncertainty) || typeof item.needs_more_context !== 'boolean') {
      throw new RequestValidationError('Provider uncertainty fields are invalid.', 'invalid_provider_output', 502)
    }
    const possibleIssue = optionalString(item.possible_codebook_issue, `Provider review ${index + 1} codebook issue`, 4_000)
    return {
      excerpt_id: excerptId,
      primary_suggested_code: primary,
      ...(alternative ? { alternative_code: alternative } : {}),
      evidence_quote: evidence,
      rationale: stringValue(item.rationale, `Provider review ${index + 1} rationale`, 8_000),
      uncertainty,
      needs_more_context: item.needs_more_context,
      ...(possibleIssue ? { possible_codebook_issue: possibleIssue } : {}),
      reviewer: OPENAI_REVIEWER_ID,
      provider: 'openai',
      model,
      prompt_version: OPENAI_PROMPT_VERSION,
      data_destination: 'openai-api',
      consent_version: REVIEWER_CONSENT_VERSION,
      reviewed_at: reviewedAt,
    }
  })
  if (seen.size !== excerpts.size) {
    throw new RequestValidationError('Provider omitted an excerpt.', 'invalid_provider_output', 502)
  }
  return reviews
}

function sendError(response: ApiResponse, error: unknown) {
  const known = error instanceof RequestValidationError
    ? error
    : new RequestValidationError('The independent reviewer could not complete.', 'reviewer_failed', 500)
  response.status(known.status).json({
    error: {
      code: known.code,
      message: known.message,
    },
  })
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')

  if (request.method === 'GET') {
    response.status(200).json(providerConfig())
    return
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    response.status(405).json({ error: { code: 'method_not_allowed', message: 'Use GET or POST.' } })
    return
  }

  const config = providerConfig()
  if (!config.configured || !config.model) {
    response.status(503).json({
      error: {
        code: 'reviewer_not_configured',
        message: 'This deployment has not configured the optional OpenAI reviewer.',
      },
    })
    return
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) as unknown : request.body
    const { requestId, payload } = parseRemoteReviewRequest(body as RemoteReviewRequest)
    const providerResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Client-Request-Id': requestId,
      },
      body: JSON.stringify(buildOpenAIRequestBody(payload)),
    })
    if (!providerResponse.ok) {
      throw new RequestValidationError(
        'The model provider did not complete this review. No human interpretation fields were sent.',
        'provider_request_failed',
        502,
      )
    }
    const providerBody = await providerResponse.json() as unknown
    let reviews: AiReview[]
    try {
      const structured = JSON.parse(outputText(providerBody)) as unknown
      reviews = validateProviderReviews(structured, payload, new Date().toISOString(), config.model)
    } catch {
      throw new RequestValidationError(
        'The model provider returned output that did not pass QualiAudit validation.',
        'invalid_provider_output',
        502,
      )
    }
    response.status(200).json({ reviews })
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendError(response, new RequestValidationError('Request or provider output was not valid JSON.', 'invalid_json'))
      return
    }
    sendError(response, error)
  }
}
