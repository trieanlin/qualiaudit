import type { ReviewState } from '../hooks/useReviewState'

const STAGE_LABELS: Record<ReviewState['view'], string> = {
  landing: 'No active review',
  setup: 'Project setup',
  materials: 'Review materials',
  freeze: 'Ready to freeze',
  reviewing: 'Independent review in progress',
  queue: 'Review queue',
  case: 'Case resolution',
  audit: 'Audit trail',
}

export interface LocalDataSummary {
  hasReview: boolean
  projectName: string | null
  stage: string
  codeCount: number
  excerptCount: number
  reviewCount: number
  decisionCount: number
  frozen: boolean
  approximateBytes: number
}

export function summariseLocalData(state: ReviewState): LocalDataSummary {
  const serialised = state.project ? JSON.stringify(state) : ''

  return {
    hasReview: Boolean(state.project),
    projectName: state.project?.name ?? null,
    stage: STAGE_LABELS[state.view],
    codeCount: state.codebook.length,
    excerptCount: state.excerpts.length,
    reviewCount: state.reviews.length,
    decisionCount: state.resolutions.length,
    frozen: Boolean(state.frozen),
    approximateBytes: new TextEncoder().encode(serialised).byteLength,
  }
}

export function formatStorageSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
