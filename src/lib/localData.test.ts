import { describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import type { ReviewState } from '../hooks/useReviewState'
import { formatStorageSize, summariseLocalData } from './localData'

function sampleState(): ReviewState {
  return {
    view: 'freeze',
    project: SAMPLE_PROJECT,
    codebook: SAMPLE_CODEBOOK,
    excerpts: SAMPLE_EXCERPTS,
    frozen: null,
    reviews: [],
    resolutions: [],
    codebookChanges: [],
    selectedExcerptId: null,
    reviewerMode: 'mock',
    providerConsent: null,
    reviewRequestId: null,
    remoteRequestStarted: false,
  }
}

describe('local data summary', () => {
  it('describes the active review without exposing its text content', () => {
    const summary = summariseLocalData(sampleState())

    expect(summary).toMatchObject({
      hasReview: true,
      projectName: SAMPLE_PROJECT.name,
      stage: 'Ready to freeze',
      codeCount: 5,
      excerptCount: 8,
      reviewCount: 0,
      decisionCount: 0,
      codebookChangeCount: 0,
      frozen: false,
    })
    expect(summary.approximateBytes).toBeGreaterThan(0)
    expect(JSON.stringify(summary)).not.toContain(SAMPLE_EXCERPTS[0].excerpt)
  })

  it('reports no retained review for the empty state', () => {
    const empty = sampleState()
    empty.view = 'landing'
    empty.project = null
    empty.codebook = []
    empty.excerpts = []

    expect(summariseLocalData(empty)).toEqual({
      hasReview: false,
      projectName: null,
      stage: 'No active review',
      codeCount: 0,
      excerptCount: 0,
      reviewCount: 0,
      decisionCount: 0,
      codebookChangeCount: 0,
      frozen: false,
      approximateBytes: 0,
    })
  })

  it('formats approximate browser-storage sizes for display', () => {
    expect(formatStorageSize(420)).toBe('420 B')
    expect(formatStorageSize(2048)).toBe('2.0 KB')
    expect(formatStorageSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })
})
