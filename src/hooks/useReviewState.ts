import { useCallback, useEffect, useState } from 'react'
import type {
  AiReview,
  AppView,
  CodebookChange,
  CodeDefinition,
  FrozenSnapshot,
  HumanCodedExcerpt,
  ProjectBrief,
  ProviderConsent,
  ReflexiveMemo,
  Resolution,
  ReviewerMode,
} from '../types'

export const STORAGE_KEY = 'qualiaudit-review-state-v0.1'

export interface ReviewState {
  view: AppView
  project: ProjectBrief | null
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  frozen: FrozenSnapshot | null
  reviews: AiReview[]
  resolutions: Resolution[]
  reflexiveMemos: ReflexiveMemo[]
  codebookChanges: CodebookChange[]
  selectedExcerptId: string | null
  reviewerMode: ReviewerMode
  providerConsent: ProviderConsent | null
  reviewRequestId: string | null
  remoteRequestStarted: boolean
}

export const INITIAL_STATE: ReviewState = {
  view: 'landing',
  project: null,
  codebook: [],
  excerpts: [],
  frozen: null,
  reviews: [],
  resolutions: [],
  reflexiveMemos: [],
  codebookChanges: [],
  selectedExcerptId: null,
  reviewerMode: 'mock',
  providerConsent: null,
  reviewRequestId: null,
  remoteRequestStarted: false,
}

function readStoredState(): ReviewState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return INITIAL_STATE
    const parsed = JSON.parse(stored) as Partial<ReviewState>
    return {
      ...INITIAL_STATE,
      ...parsed,
      reviewerMode: parsed.reviewerMode === 'openai' ? 'openai' : 'mock',
      providerConsent: parsed.providerConsent ?? null,
      reflexiveMemos: Array.isArray(parsed.reflexiveMemos) ? parsed.reflexiveMemos : [],
      codebookChanges: Array.isArray(parsed.codebookChanges) ? parsed.codebookChanges : [],
      reviewRequestId: parsed.reviewRequestId ?? null,
      remoteRequestStarted: parsed.remoteRequestStarted === true,
    }
  } catch {
    return INITIAL_STATE
  }
}

export function useReviewState() {
  const [state, setState] = useState<ReviewState>(readStoredState)

  useEffect(() => {
    if (state.project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [state])

  const patchState = useCallback((patch: Partial<ReviewState>) => {
    setState((current) => ({ ...current, ...patch }))
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(INITIAL_STATE)
  }, [])

  return { state, setState, patchState, reset }
}
