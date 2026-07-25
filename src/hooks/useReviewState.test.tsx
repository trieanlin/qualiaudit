import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { INITIAL_STATE, STORAGE_KEY, useReviewState, type ReviewState } from './useReviewState'

function savedState(): ReviewState {
  return {
    view: 'materials',
    project: SAMPLE_PROJECT,
    codebook: SAMPLE_CODEBOOK,
    excerpts: SAMPLE_EXCERPTS,
    frozen: null,
    reviews: [],
    resolutions: [],
    selectedExcerptId: null,
  }
}

describe('browser review persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores and explicitly removes QualiAudit’s own saved review', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState()))
    localStorage.setItem('unrelated-website-record', 'leave-me-alone')

    const { result } = renderHook(() => useReviewState())
    expect(result.current.state.project?.name).toBe(SAMPLE_PROJECT.name)

    act(() => result.current.reset())

    expect(result.current.state).toEqual(INITIAL_STATE)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('unrelated-website-record')).toBe('leave-me-alone')
  })

  it('does not retain an empty landing state', () => {
    renderHook(() => useReviewState())
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
