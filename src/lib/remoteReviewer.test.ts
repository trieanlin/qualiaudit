import { afterEach, describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildBlindReviewPayload } from './reviewer'
import { runOpenAiBlindReview } from './remoteReviewer'

afterEach(() => vi.unstubAllGlobals())

describe('remote reviewer client', () => {
  it('preserves safe retry and support metadata from a rate-limit response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      error: {
        code: 'provider_rate_limited',
        message: 'The provider asked this deployment to wait.',
        retry_after_seconds: 17,
        request_id: 'client-request-test',
        provider_request_id: 'provider-request-test',
      },
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })))

    const promise = runOpenAiBlindReview(
      buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
      'client-request-test',
    )

    await expect(promise).rejects.toMatchObject({
      code: 'provider_rate_limited',
      status: 429,
      retryAfterSeconds: 17,
      requestId: 'client-request-test',
      providerRequestId: 'provider-request-test',
    })
  })
})
