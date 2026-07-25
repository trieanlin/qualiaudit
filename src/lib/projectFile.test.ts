import { describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import type { ReviewState } from '../hooks/useReviewState'
import { buildBlindReviewPayload, runMockBlindReview } from './reviewer'
import {
  parsePortableProjectFile,
  projectFileName,
  ProjectFileError,
  serialisePortableProject,
} from './projectFile'

function completedState(): ReviewState {
  const reviews = runMockBlindReview(
    buildBlindReviewPayload(SAMPLE_PROJECT, SAMPLE_CODEBOOK, SAMPLE_EXCERPTS),
    '2026-07-25T08:45:00.000Z',
  )
  return {
    view: 'audit',
    project: SAMPLE_PROJECT,
    codebook: SAMPLE_CODEBOOK,
    excerpts: SAMPLE_EXCERPTS,
    frozen: {
      frozenAt: '2026-07-25T08:30:00.000Z',
      project: SAMPLE_PROJECT,
      codebook: SAMPLE_CODEBOOK,
      humanCoding: SAMPLE_EXCERPTS,
    },
    reviews,
    resolutions: [{
      excerpt_id: 'SYN-002',
      decision: 'keep_both',
      rationale: 'Both readings matter for the analytic question.',
      final_code: 'FAMILY_FEEDBACK + PRIVACY_BOUNDARY',
      decided_at: '2026-07-25T09:00:00.000Z',
      changed_after_ai_exposure: true,
    }],
    selectedExcerptId: null,
    reviewerMode: 'mock',
    providerConsent: null,
    reviewRequestId: 'portable-project-test-request',
    remoteRequestStarted: false,
  }
}

describe('portable project files', () => {
  it('round-trips the complete frozen review and decision log', () => {
    const source = completedState()
    const restored = parsePortableProjectFile(
      serialisePortableProject(source, '2026-07-25T09:05:00.000Z'),
    )

    expect(restored).toMatchObject({
      format: 'qualiaudit-project',
      schema_version: 1,
      exported_at: '2026-07-25T09:05:00.000Z',
    })
    expect(restored.state.view).toBe('audit')
    expect(restored.state.frozen?.humanCoding).toHaveLength(8)
    expect(restored.state.reviews).toHaveLength(8)
    expect(restored.state.reviews[0].schema_version).toBe('mock-review-output-v0.1')
    expect(restored.state.resolutions[0]).toMatchObject({
      excerpt_id: 'SYN-002',
      decision: 'keep_both',
      changed_after_ai_exposure: true,
    })
  })

  it('normalises an invalid case selection to the review queue', () => {
    const source = completedState()
    source.view = 'case'
    source.selectedExcerptId = 'NOT-IN-REVIEW'

    const restored = parsePortableProjectFile(serialisePortableProject(source))
    expect(restored.state.view).toBe('queue')
    expect(restored.state.selectedExcerptId).toBeNull()
  })

  it('preserves remote reviewer protocol and request provenance', () => {
    const source = completedState()
    source.reviews[0] = {
      ...source.reviews[0],
      reviewer: 'openai-responses-v0.2',
      provider: 'openai',
      model: 'deployment-model',
      prompt_version: 'blind-review-v0.2',
      schema_version: 'blind-review-schema-v0.2',
      data_destination: 'openai-api',
      consent_version: 'qualiaudit-openai-consent-v0.2',
      request_id: 'qa-client-request',
      provider_request_id: 'provider-request',
      provider_response_id: 'resp_example',
    }

    const restored = parsePortableProjectFile(serialisePortableProject(source))
    expect(restored.state.reviews[0]).toMatchObject({
      reviewer: 'openai-responses-v0.2',
      prompt_version: 'blind-review-v0.2',
      schema_version: 'blind-review-schema-v0.2',
      request_id: 'qa-client-request',
      provider_request_id: 'provider-request',
      provider_response_id: 'resp_example',
    })
  })

  it('rejects audit exports and unsupported project-file versions', () => {
    expect(() => parsePortableProjectFile(JSON.stringify({
      schema_version: 'qualiaudit-audit-v0.1',
      project: SAMPLE_PROJECT,
    }))).toThrowError(new ProjectFileError(
      'This is not a QualiAudit project file. Audit JSON exports cannot be resumed.',
    ))

    const unsupported = JSON.parse(serialisePortableProject(completedState())) as Record<string, unknown>
    unsupported.schema_version = 2
    expect(() => parsePortableProjectFile(JSON.stringify(unsupported))).toThrow(/version is not supported/)
  })

  it('rejects review records that are not backed by the frozen excerpt set', () => {
    const source = completedState()
    source.reviews[0] = { ...source.reviews[0], excerpt_id: 'MISSING' }

    expect(() => parsePortableProjectFile(serialisePortableProject(source))).toThrow(/not in the frozen record/)
  })

  it('creates a filesystem-friendly project filename', () => {
    expect(projectFileName('Staying with home sleep monitoring')).toBe(
      'staying-with-home-sleep-monitoring.qualiaudit.json',
    )
    expect(projectFileName('研究项目')).toBe('qualiaudit-review.qualiaudit.json')
  })
})
