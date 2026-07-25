import {
  ACTIVE_REVIEWER_PROTOCOL,
  OPENAI_PROMPT_VERSION,
  OPENAI_REVIEWER_ID,
  OPENAI_SCHEMA_VERSION,
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
const DEFAULT_PROVIDER_TIMEOUT_MS = 45_000
const MIN_PROVIDER_TIMEOUT_MS = 10_000
const MAX_PROVIDER_TIMEOUT_MS = 120_000
const CONFIDENCE_VALUES = new Set<Confidence>(['low', 'medium', 'high'])

class RequestValidationError extends Error {
  code: string
  status: number
  retryAfterSeconds?: number
  requestId?: string
  providerRequestId?: string

  constructor(
    message: string,
    code = 'invalid_request',
    status = 400,
    details: {
      retryAfterSeconds?: number
      requestId?: string
      providerRequestId?: string
    } = {},
  ) {
    super(message)
    this.name = 'RequestValidationError'
    this.code = code
    this.status = status
    this.retryAfterSeconds = details.retryAfterSeconds
    this.requestId = details.requestId
    this.providerRequestId = details.providerRequestId
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
  const requestId = stringValue(source.request_id, 'Request ID', 120)
  if (!/^[\x21-\x7E]+$/.test(requestId)) {
    throw new RequestValidationError('Request ID must contain printable ASCII characters only.')
  }
  return {
    requestId,
    payload: sanitiseBlindReviewPayload(source.payload),
  }
}

function providerTimeoutMs(): number {
  const configured = Number(process.env.QUALIAUDIT_REVIEW_TIMEOUT_MS)
  if (!Number.isFinite(configured)) return DEFAULT_PROVIDER_TIMEOUT_MS
  return Math.min(MAX_PROVIDER_TIMEOUT_MS, Math.max(MIN_PROVIDER_TIMEOUT_MS, Math.round(configured)))
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
    promptVersion: OPENAI_PROMPT_VERSION,
    schemaVersion: OPENAI_SCHEMA_VERSION,
    requestTimeoutMs: providerTimeoutMs(),
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

export function buildOpenAIRequestBody(payload: BlindReviewPayload, model: string) {
  return {
    model,
    store: false,
    instructions: ACTIVE_REVIEWER_PROTOCOL.instructions.join(' '),
    input: JSON.stringify(payload),
    text: {
      format: {
        type: 'json_schema',
        name: ACTIVE_REVIEWER_PROTOCOL.responseFormatName,
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

interface ReviewExecutionMetadata {
  reviewedAt: string
  model: string
  requestId: string
  providerRequestId?: string
  providerResponseId?: string
}

export function validateProviderReviews(
  value: unknown,
  payload: BlindReviewPayload,
  execution: ReviewExecutionMetadata,
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
      model: execution.model,
      prompt_version: OPENAI_PROMPT_VERSION,
      schema_version: OPENAI_SCHEMA_VERSION,
      data_destination: 'openai-api',
      consent_version: REVIEWER_CONSENT_VERSION,
      request_id: execution.requestId,
      ...(execution.providerRequestId ? { provider_request_id: execution.providerRequestId } : {}),
      ...(execution.providerResponseId ? { provider_response_id: execution.providerResponseId } : {}),
      reviewed_at: execution.reviewedAt,
    }
  })
  if (seen.size !== excerpts.size) {
    throw new RequestValidationError('Provider omitted an excerpt.', 'invalid_provider_output', 502)
  }
  return reviews
}

function safeProviderResponseId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const id = (value as { id?: unknown }).id
  return typeof id === 'string' && id.length <= 240 ? id : undefined
}

function retryAfterSeconds(value: string | null): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(3_600, Math.ceil(seconds))
  const date = Date.parse(value)
  if (Number.isNaN(date)) return undefined
  return Math.min(3_600, Math.max(0, Math.ceil((date - Date.now()) / 1_000)))
}

function providerFailure(response: Response, requestId: string): RequestValidationError {
  const providerRequestId = response.headers.get('x-request-id') ?? undefined
  const details = { requestId, providerRequestId }
  if (response.status === 429) {
    return new RequestValidationError(
      'The model provider is temporarily rate limited. QualiAudit did not retry automatically.',
      'provider_rate_limited',
      429,
      {
        ...details,
        retryAfterSeconds: retryAfterSeconds(response.headers.get('retry-after')),
      },
    )
  }
  if (response.status === 401 || response.status === 403) {
    return new RequestValidationError(
      'The server-side provider credentials or project access need attention.',
      'provider_configuration_error',
      503,
      details,
    )
  }
  return new RequestValidationError(
    'The model provider did not complete this review. No human interpretation fields were sent.',
    response.status >= 500 ? 'provider_unavailable' : 'provider_request_failed',
    502,
    details,
  )
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function sendError(response: ApiResponse, error: unknown) {
  const known = error instanceof RequestValidationError
    ? error
    : new RequestValidationError('The independent reviewer could not complete.', 'reviewer_failed', 500)
  if (known.retryAfterSeconds !== undefined) {
    response.setHeader('Retry-After', String(known.retryAfterSeconds))
  }
  response.status(known.status).json({
    error: {
      code: known.code,
      message: known.message,
      ...(known.retryAfterSeconds !== undefined ? { retry_after_seconds: known.retryAfterSeconds } : {}),
      ...(known.requestId ? { request_id: known.requestId } : {}),
      ...(known.providerRequestId ? { provider_request_id: known.providerRequestId } : {}),
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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs)
    let providerResponse: Response
    try {
      providerResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Client-Request-Id': requestId,
        },
        body: JSON.stringify(buildOpenAIRequestBody(payload, config.model)),
        signal: controller.signal,
      })
    } catch (error) {
      if (isAbortError(error)) {
        throw new RequestValidationError(
          'The model provider did not respond before the server timeout. QualiAudit did not retry automatically.',
          'provider_timeout',
          504,
          { requestId },
        )
      }
      throw new RequestValidationError(
        'The server could not reach the model provider. QualiAudit did not retry automatically.',
        'provider_unavailable',
        502,
        { requestId },
      )
    } finally {
      clearTimeout(timeout)
    }
    if (!providerResponse.ok) throw providerFailure(providerResponse, requestId)
    const providerBody = await providerResponse.json() as unknown
    const providerRequestId = providerResponse.headers.get('x-request-id') ?? undefined
    let reviews: AiReview[]
    try {
      const structured = JSON.parse(outputText(providerBody)) as unknown
      reviews = validateProviderReviews(structured, payload, {
        reviewedAt: new Date().toISOString(),
        model: config.model,
        requestId,
        providerRequestId,
        providerResponseId: safeProviderResponseId(providerBody),
      })
    } catch {
      throw new RequestValidationError(
        'The model provider returned output that did not pass QualiAudit validation.',
        'invalid_provider_output',
        502,
        { requestId, providerRequestId },
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
