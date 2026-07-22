import { useCallback, useEffect, useState } from 'react'
import type {
  AiReview,
  AppView,
  CodeDefinition,
  FrozenSnapshot,
  HumanCodedExcerpt,
  ProjectBrief,
  Resolution,
} from '../types'

const STORAGE_KEY = 'qualiaudit-review-state-v0.1'

export interface ReviewState {
  view: AppView
  project: ProjectBrief | null
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  frozen: FrozenSnapshot | null
  reviews: AiReview[]
  resolutions: Resolution[]
  selectedExcerptId: string | null
}

export const INITIAL_STATE: ReviewState = {
  view: 'landing',
  project: null,
  codebook: [],
  excerpts: [],
  frozen: null,
  reviews: [],
  resolutions: [],
  selectedExcerptId: null,
}

function readStoredState(): ReviewState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as ReviewState) : INITIAL_STATE
  } catch {
    return INITIAL_STATE
  }
}

export function useReviewState() {
  const [state, setState] = useState<ReviewState>(readStoredState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const patchState = useCallback((patch: Partial<ReviewState>) => {
    setState((current) => ({ ...current, ...patch }))
  }, [])

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  return { state, setState, patchState, reset }
}
