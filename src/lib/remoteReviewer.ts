import type { AiReview, BlindReviewPayload } from '../types'
import {
  REVIEWER_CONSENT_VERSION,
  type RemoteReviewErrorResponse,
  type RemoteReviewRequest,
  type RemoteReviewResponse,
  type ReviewerProviderConfig,
} from './reviewerProtocol'

const CLIENT_REQUEST_TIMEOUT_MS = 130_000

export class RemoteReviewerError extends Error {
  code: string
  status: number
  retryAfterSeconds?: number
  requestId?: string
  providerRequestId?: string

  constructor(
    message: string,
    code = 'remote_reviewer_error',
    status = 0,
    details: {
      retryAfterSeconds?: number
      requestId?: string
      providerRequestId?: string
    } = {},
  ) {
    super(message)
    this.name = 'RemoteReviewerError'
    this.code = code
    this.status = status
    this.retryAfterSeconds = details.retryAfterSeconds
    this.requestId = details.requestId
    this.providerRequestId = details.providerRequestId
  }
}
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function errorDetails(value: unknown): Partial<RemoteReviewErrorResponse['error']> {
  if (!value || typeof value !== 'object') return {}
  const error = 'error' in value ? (value as { error?: unknown }).error : null
  if (!error || typeof error !== 'object') return {}
  const candidate = error as Record<string, unknown>
  return {
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
    retry_after_seconds: typeof candidate.retry_after_seconds === 'number'
      ? candidate.retry_after_seconds
      : undefined,
    request_id: typeof candidate.request_id === 'string' ? candidate.request_id : undefined,
    provider_request_id: typeof candidate.provider_request_id === 'string'
      ? candidate.provider_request_id
      : undefined,
  }
}

export async function fetchReviewerProviderConfig(signal?: AbortSignal): Promise<ReviewerProviderConfig> {
  const response = await fetch('/api/review', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })
  const body = await readJson(response)
  if (!response.ok || !body || typeof body !== 'object') {
    throw new RemoteReviewerError('Reviewer configuration could not be checked.', 'configuration_unavailable', response.status)
  }
  return body as ReviewerProviderConfig
}

export async function runOpenAiBlindReview(
  payload: BlindReviewPayload,
  requestId: string,
): Promise<AiReview[]> {
  const request: RemoteReviewRequest = {
    request_id: requestId,
    consent: {
      granted: true,
      version: REVIEWER_CONSENT_VERSION,
    },
    payload,
  }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), CLIENT_REQUEST_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch('/api/review', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new RemoteReviewerError(
        'The review request exceeded the browser safety timeout. Its provider-side outcome may be unknown.',
        'client_timeout',
        0,
        { requestId },
      )
    }
    throw new RemoteReviewerError(
      'The browser could not reach the QualiAudit review endpoint.',
      'review_endpoint_unavailable',
      0,
      { requestId },
    )
  } finally {
    window.clearTimeout(timeout)
  }
  const body = await readJson(response)
  if (!response.ok) {
    const details = errorDetails(body)
    throw new RemoteReviewerError(
      details.message ?? 'The independent reviewer did not complete.',
      details.code,
      response.status,
      {
        retryAfterSeconds: details.retry_after_seconds,
        requestId: details.request_id ?? requestId,
        providerRequestId: details.provider_request_id,
      },
    )
  }
  const result = body as RemoteReviewResponse
  if (!Array.isArray(result?.reviews)) {
    throw new RemoteReviewerError('The reviewer returned an invalid response.', 'invalid_response', response.status)
  }
  return result.reviews
}
