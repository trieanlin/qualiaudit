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
    reflexiveMemos: [],
    codebookChanges: [],
    selectedExcerptId: null,
    reviewerMode: 'mock',
    providerConsent: null,
    reviewRequestId: 'portable-project-test-request',
    remoteRequestStarted: false,
  }
}

function addCodebookChange(source: ReviewState): void {
  const before = SAMPLE_CODEBOOK.find((item) => item.code === 'FAMILY_FEEDBACK')
  if (!before) throw new Error('Missing sample code')
  source.resolutions[0] = {
    excerpt_id: 'SYN-002',
    decision: 'revise_codebook',
    rationale: 'The boundary between welcomed feedback and monitoring needs clearer guidance.',
    final_code: 'FAMILY_FEEDBACK',
    codebook_change_id: 'change-family-feedback',
    decided_at: '2026-07-25T09:00:00.000Z',
    changed_after_ai_exposure: true,
  }
  source.codebookChanges = [{
    ledger_version: 'qualiaudit-codebook-change-v0.1',
    id: 'change-family-feedback',
    trigger_excerpt_id: 'SYN-002',
    code: 'FAMILY_FEEDBACK',
    before: { ...before },
    after: {
      ...before,
      definition: 'How welcomed, negotiated, or unwanted family feedback shapes engagement.',
    },
    author: 'Researcher',
    rationale: 'The boundary between welcomed feedback and monitoring needs clearer guidance.',
    created_at: '2026-07-25T09:00:00.000Z',
    affected_excerpt_ids: ['SYN-002', 'SYN-007'],
    unresolved_recode_excerpt_ids: ['SYN-002', 'SYN-007'],
  }]
}

function addReflexiveMemo(source: ReviewState): void {
  const resolution = source.resolutions[0]
  source.reflexiveMemos = [{
    memo_version: 'qualiaudit-reflexive-memo-v0.1',
    id: 'memo-syn-002',
    excerpt_id: resolution.excerpt_id,
    resolution_decided_at: resolution.decided_at,
    decision: resolution.decision,
    author: 'Researcher',
    body: 'The comparison foregrounded how family involvement and privacy can coexist in tension.',
    created_at: '2026-07-25T09:03:00.000Z',
  }]
}

describe('portable project files', () => {
  it('round-trips the complete frozen review and decision log', () => {
    const source = completedState()
    const restored = parsePortableProjectFile(
      serialisePortableProject(source, '2026-07-25T09:05:00.000Z'),
    )

    expect(restored).toMatchObject({
      format: 'qualiaudit-project',
      schema_version: 3,
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

  it('round-trips append-only reflexive memos linked to a human decision', () => {
    const source = completedState()
    addReflexiveMemo(source)

    const restored = parsePortableProjectFile(serialisePortableProject(source))
    expect(restored.state.reflexiveMemos).toEqual(source.reflexiveMemos)
    expect(restored.state.reflexiveMemos[0]).toMatchObject({
      excerpt_id: 'SYN-002',
      decision: 'keep_both',
      author: 'Researcher',
    })
  })

  it('round-trips codebook change history without rewriting the frozen baseline', () => {
    const source = completedState()
    addCodebookChange(source)

    const restored = parsePortableProjectFile(serialisePortableProject(source))
    expect(restored.state.codebookChanges[0]).toMatchObject({
      id: 'change-family-feedback',
      code: 'FAMILY_FEEDBACK',
      author: 'Researcher',
      affected_excerpt_ids: ['SYN-002', 'SYN-007'],
      unresolved_recode_excerpt_ids: ['SYN-002', 'SYN-007'],
    })
    expect(restored.state.codebookChanges[0].before).toEqual(
      restored.state.frozen?.codebook.find((item) => item.code === 'FAMILY_FEEDBACK'),
    )
    expect(restored.state.codebookChanges[0].after.definition).toContain('negotiated')
    expect(restored.state.frozen?.codebook.find((item) => item.code === 'FAMILY_FEEDBACK')?.definition)
      .toBe(SAMPLE_CODEBOOK.find((item) => item.code === 'FAMILY_FEEDBACK')?.definition)
  })

  it('migrates legacy version 1 project files with an empty change ledger', () => {
    const legacy = JSON.parse(serialisePortableProject(completedState())) as {
      schema_version: number
      state: Record<string, unknown>
    }
    legacy.schema_version = 1
    delete legacy.state.codebookChanges

    const restored = parsePortableProjectFile(JSON.stringify(legacy))
    expect(restored.schema_version).toBe(3)
    expect(restored.state.codebookChanges).toEqual([])
    expect(restored.state.reflexiveMemos).toEqual([])
  })

  it('migrates version 2 project files with an empty reflexive memo log', () => {
    const legacy = JSON.parse(serialisePortableProject(completedState())) as {
      schema_version: number
      state: Record<string, unknown>
    }
    legacy.schema_version = 2
    delete legacy.state.reflexiveMemos

    const restored = parsePortableProjectFile(JSON.stringify(legacy))
    expect(restored.schema_version).toBe(3)
    expect(restored.state.reflexiveMemos).toEqual([])
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
    unsupported.schema_version = 999
    expect(() => parsePortableProjectFile(JSON.stringify(unsupported))).toThrow(/version is not supported/)
  })

  it('rejects review records that are not backed by the frozen excerpt set', () => {
    const source = completedState()
    source.reviews[0] = { ...source.reviews[0], excerpt_id: 'MISSING' }

    expect(() => parsePortableProjectFile(serialisePortableProject(source))).toThrow(/not in the frozen record/)
  })

  it('rejects a codebook change that rewrites its frozen baseline', () => {
    const source = completedState()
    addCodebookChange(source)
    source.codebookChanges[0].before.definition = 'Rewritten historical definition'

    expect(() => parsePortableProjectFile(serialisePortableProject(source))).toThrow(
      /does not match the frozen codebook baseline/,
    )
  })

  it('rejects a reflexive memo without a linked human decision', () => {
    const source = completedState()
    addReflexiveMemo(source)
    source.reflexiveMemos[0].excerpt_id = 'SYN-003'

    expect(() => parsePortableProjectFile(serialisePortableProject(source))).toThrow(
      /case with a recorded human decision/,
    )
  })

  it('creates a filesystem-friendly project filename', () => {
    expect(projectFileName('Staying with home sleep monitoring')).toBe(
      'staying-with-home-sleep-monitoring.qualiaudit.json',
    )
    expect(projectFileName('研究项目')).toBe('qualiaudit-review.qualiaudit.json')
  })
})
