import type { AiReview, BlindReviewPayload } from '../types'
import {
  REVIEWER_CONSENT_VERSION,
  type RemoteReviewRequest,
  type RemoteReviewResponse,
  type ReviewerProviderConfig,
} from './reviewerProtocol'

export class RemoteReviewerError extends Error {
  code: string
  status: number

  constructor(message: string, code = 'remote_reviewer_error', status = 0) {
    super(message)
    this.name = 'RemoteReviewerError'
    this.code = code
    this.status = status
  }
}
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function errorDetails(value: unknown): { code?: string; message?: string } {
  if (!value || typeof value !== 'object') return {}
  const error = 'error' in value ? (value as { error?: unknown }).error : null
  if (!error || typeof error !== 'object') return {}
  const candidate = error as { code?: unknown; message?: unknown }
  return {
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
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
  const response = await fetch('/api/review', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  const body = await readJson(response)
  if (!response.ok) {
    const details = errorDetails(body)
    throw new RemoteReviewerError(
      details.message ?? 'The independent reviewer did not complete.',
      details.code,
      response.status,
    )
  }
  const result = body as RemoteReviewResponse
  if (!Array.isArray(result?.reviews)) {
    throw new RemoteReviewerError('The reviewer returned an invalid response.', 'invalid_response', response.status)
  }
  return result.reviews
}
