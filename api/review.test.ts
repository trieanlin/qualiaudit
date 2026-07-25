// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../src/data/sample'
import { buildBlindReviewPayload } from '../src/lib/reviewer'
import { REVIEWER_CONSENT_VERSION } from '../src/lib/reviewerProtocol'
import handler, {
  buildOpenAIRequestBody,
  sanitiseBlindReviewPayload,
} from './review'

function responseRecorder() {
  const result = {
    statusCode: 0,
    body: null as unknown,
    headers: new Map<string, string>(),
  }
  return {
    result,
    response: {
      status(code: number) {
        result.statusCode = code
        return this
      },
      json(body: unknown) {
        result.body = body
      },
      setHeader(name: string, value: string) {
        result.headers.set(name, value)
      },
    },
  }
}

function oneExcerptPayload() {
  const payload = buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS)
  return { ...payload, excerpts: payload.excerpts.slice(0, 1) }
}

describe('server-side reviewer boundary', () => {
  const originalKey = process.env.OPENAI_API_KEY
  const originalModel = process.env.OPENAI_MODEL
  const originalRegion = process.env.QUALIAUDIT_OPENAI_REGION
  const originalEnabled = process.env.QUALIAUDIT_ENABLE_REMOTE_REVIEW

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-server-key'
    process.env.OPENAI_MODEL = 'test-review-model'
    process.env.QUALIAUDIT_OPENAI_REGION = 'Test account region'
    process.env.QUALIAUDIT_ENABLE_REMOTE_REVIEW = 'true'
  })

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey
    process.env.OPENAI_MODEL = originalModel
    process.env.QUALIAUDIT_OPENAI_REGION = originalRegion
    process.env.QUALIAUDIT_ENABLE_REMOTE_REVIEW = originalEnabled
    vi.unstubAllGlobals()
  })

  it('rebuilds an allowlisted payload even if extra human fields are submitted', () => {
    const unsafe = structuredClone(oneExcerptPayload()) as unknown as {
      excerpts: Array<Record<string, unknown>>
      human_code?: string
    }
    unsafe.human_code = 'PRIVATE_TOP_LEVEL_CODE'
    unsafe.excerpts[0].human_code = 'PRIVATE_EXCERPT_CODE'
    unsafe.excerpts[0].human_rationale = 'private rationale'

    const safe = sanitiseBlindReviewPayload(unsafe)
    const serialised = JSON.stringify(safe)

    expect(Object.keys(safe.excerpts[0])).toEqual(['excerpt_id', 'source_id', 'excerpt', 'context'])
    expect(serialised).not.toContain('PRIVATE_TOP_LEVEL_CODE')
    expect(serialised).not.toContain('PRIVATE_EXCERPT_CODE')
    expect(serialised).not.toContain('private rationale')
  })

  it('reports configuration without exposing the server key', async () => {
    const { result, response } = responseRecorder()

    await handler({ method: 'GET' }, response)

    expect(result.statusCode).toBe(200)
    expect(result.body).toMatchObject({
      provider: 'OpenAI API',
      configured: true,
      model: 'test-review-model',
      region: 'Test account region',
      responsesStored: false,
    })
    expect(JSON.stringify(result.body)).not.toContain('test-server-key')
  })

  it('rejects transmission without the versioned explicit consent record', async () => {
    const providerFetch = vi.fn()
    vi.stubGlobal('fetch', providerFetch)
    const { result, response } = responseRecorder()

    await handler({
      method: 'POST',
      body: {
        request_id: 'request-without-consent',
        payload: oneExcerptPayload(),
      },
    }, response)

    expect(result.statusCode).toBe(400)
    expect(result.body).toMatchObject({ error: { code: 'consent_required' } })
    expect(providerFetch).not.toHaveBeenCalled()
  })

  it('requests store=false and saves only provider output that passes structural checks', async () => {
    const payload = oneExcerptPayload()
    const excerpt = payload.excerpts[0]
    const providerFetch = vi.fn(async (_url: string, init: RequestInit) => {
      const providerRequest = JSON.parse(String(init.body)) as ReturnType<typeof buildOpenAIRequestBody>
      expect(providerRequest.store).toBe(false)
      expect(providerRequest.model).toBe('test-review-model')
      expect(JSON.stringify(providerRequest)).not.toContain('human_code')
      return new Response(JSON.stringify({
        output_text: JSON.stringify({
          reviews: [{
            excerpt_id: excerpt.excerpt_id,
            primary_suggested_code: SAMPLE_CODEBOOK[0].code,
            alternative_code: null,
            evidence_quote: excerpt.excerpt.slice(0, 20),
            rationale: 'A bounded independent reading grounded in the supplied codebook.',
            uncertainty: 'medium',
            needs_more_context: false,
            possible_codebook_issue: null,
          }],
        }),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', providerFetch)
    const { result, response } = responseRecorder()

    await handler({
      method: 'POST',
      body: {
        request_id: 'consented-test-request',
        consent: { granted: true, version: REVIEWER_CONSENT_VERSION },
        payload,
      },
    }, response)

    expect(result.statusCode).toBe(200)
    expect(result.body).toMatchObject({
      reviews: [{
        excerpt_id: excerpt.excerpt_id,
        reviewer: 'openai-responses-v0.2',
        provider: 'openai',
        model: 'test-review-model',
        prompt_version: 'blind-review-v0.2',
        data_destination: 'openai-api',
        consent_version: REVIEWER_CONSENT_VERSION,
      }],
    })
    expect(providerFetch).toHaveBeenCalledOnce()
    const call = providerFetch.mock.calls[0]
    expect(call[0]).toBe('https://api.openai.com/v1/responses')
    expect((call[1]?.headers as Record<string, string>).Authorization).toBe('Bearer test-server-key')
  })
})
