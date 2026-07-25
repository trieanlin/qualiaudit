import { useCallback, useState } from 'react'
import { Audit } from './components/Audit'
import { CaseResolution } from './components/CaseResolution'
import { FreezeReview, Reviewing } from './components/FreezeReview'
import { Landing } from './components/Landing'
import { LocalDataDialog } from './components/LocalDataDialog'
import { Materials } from './components/Materials'
import { ReviewQueue } from './components/ReviewQueue'
import { Setup } from './components/Setup'
import { Shell } from './components/Shell'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from './data/sample'
import { useReviewState } from './hooks/useReviewState'
import { downloadText } from './lib/export'
import { projectFileName, serialisePortableProject } from './lib/projectFile'
import { REMOTE_REVIEW_EXACT_FIELDS, REVIEWER_CONSENT_VERSION } from './lib/reviewerProtocol'
import type { AiReview, CodebookChange, ProjectBrief, Resolution, ReviewerMode } from './types'

function cloneSample() {
  return {
    project: { ...SAMPLE_PROJECT },
    codebook: SAMPLE_CODEBOOK.map((item) => ({ ...item })),
    excerpts: SAMPLE_EXCERPTS.map((item) => ({ ...item })),
  }
}

export default function App() {
  const { state, setState, patchState, reset } = useReviewState()
  const [showLocalData, setShowLocalData] = useState(false)

  const openSample = () => {
    const sample = cloneSample()
    patchState({
      ...sample,
      view: 'materials',
      frozen: null,
      reviews: [],
      resolutions: [],
      codebookChanges: [],
      selectedExcerptId: null,
      reviewerMode: 'mock',
      providerConsent: null,
      reviewRequestId: null,
      remoteRequestStarted: false,
    })
  }

  const startSetup = () => {
    const sample = cloneSample()
    patchState({
      ...sample,
      view: 'setup',
      frozen: null,
      reviews: [],
      resolutions: [],
      codebookChanges: [],
      selectedExcerptId: null,
      reviewerMode: 'mock',
      providerConsent: null,
      reviewRequestId: null,
      remoteRequestStarted: false,
    })
  }

  const handleReset = () => {
    if (state.view === 'landing' || window.confirm('Start over? This clears the review saved in this browser. Save a project file first if you need to resume it later.')) reset()
  }

  const saveProject = (project: ProjectBrief) => patchState({ project, view: 'materials' })

  const saveProjectFile = () => {
    if (!state.project) return
    downloadText(
      projectFileName(state.project.name),
      serialisePortableProject(state),
      'application/json;charset=utf-8',
    )
  }

  const freeze = (reviewerMode: ReviewerMode) => {
    if (!state.project) return
    const now = new Date().toISOString()
    patchState({
      frozen: {
        frozenAt: now,
        project: { ...state.project },
        codebook: state.codebook.map((item) => ({ ...item })),
        humanCoding: state.excerpts.map((item) => ({ ...item })),
      },
      reviews: [],
      resolutions: [],
      codebookChanges: [],
      view: 'reviewing',
      reviewerMode,
      providerConsent: reviewerMode === 'openai'
        ? {
            version: REVIEWER_CONSENT_VERSION,
            provider: 'openai',
            grantedAt: now,
            exactFields: [...REMOTE_REVIEW_EXACT_FIELDS],
          }
        : null,
      reviewRequestId: crypto.randomUUID(),
      remoteRequestStarted: false,
    })
  }

  const completeReview = useCallback((reviews: AiReview[]) => {
    patchState({ reviews, view: 'queue' })
  }, [patchState])

  const openCase = (excerptId: string) => patchState({ selectedExcerptId: excerptId, view: 'case' })

  const saveResolution = (resolution: Resolution, codebookChange?: CodebookChange) => {
    const next = state.resolutions.filter((item) => item.excerpt_id !== resolution.excerpt_id)
    patchState({
      resolutions: [...next, resolution],
      codebookChanges: codebookChange
        ? [...state.codebookChanges, codebookChange]
        : state.codebookChanges,
      view: 'queue',
      selectedExcerptId: null,
    })
  }

  const navigate = (view: typeof state.view) => patchState({ view, selectedExcerptId: null })

  const localDataDialog = showLocalData ? (
    <LocalDataDialog
      state={state}
      onClose={() => setShowLocalData(false)}
      onSaveProject={saveProjectFile}
      onClear={reset}
    />
  ) : null

  if (state.view === 'landing' || !state.project) {
    return (
      <>
        <Landing
          onOpenSample={openSample}
          onNewReview={startSetup}
          onRestoreProject={setState}
          onManageData={() => setShowLocalData(true)}
        />
        {localDataDialog}
      </>
    )
  }

  const activeProject = state.frozen?.project ?? state.project
  const activeCodebook = state.frozen?.codebook ?? state.codebook
  const activeExcerpts = state.frozen?.humanCoding ?? state.excerpts
  const selectedHuman = activeExcerpts.find((item) => item.excerpt_id === state.selectedExcerptId)
  const selectedAi = state.reviews.find((item) => item.excerpt_id === state.selectedExcerptId)
  const selectedResolution = state.resolutions.find((item) => item.excerpt_id === state.selectedExcerptId)
  const selectedCodebookChange = selectedResolution?.codebook_change_id
    ? state.codebookChanges.find((item) => item.id === selectedResolution.codebook_change_id)
    : undefined

  return (
    <>
      <Shell
        view={state.view}
        project={activeProject}
        canReview={state.reviews.length > 0}
        canAudit={Boolean(state.frozen && state.reviews.length)}
        onNavigate={navigate}
        onReset={handleReset}
        onSaveProject={saveProjectFile}
        onManageData={() => setShowLocalData(true)}
      >
      {state.view === 'setup' && (
        <Setup
          project={activeProject}
          locked={Boolean(state.frozen)}
          onContinue={state.frozen ? () => patchState({ view: 'queue' }) : saveProject}
        />
      )}
      {state.view === 'materials' && (
        <Materials
          codebook={activeCodebook}
          excerpts={activeExcerpts}
          locked={Boolean(state.frozen)}
          onChangeCodebook={(codebook) => patchState({ codebook })}
          onChangeExcerpts={(excerpts) => patchState({ excerpts })}
          onContinue={() => patchState({ view: state.frozen ? 'queue' : 'freeze' })}
        />
      )}
      {state.view === 'freeze' && (
        <FreezeReview
          project={activeProject}
          codebook={activeCodebook}
          excerpts={activeExcerpts}
          onBack={() => patchState({ view: 'materials' })}
          onFreeze={freeze}
        />
      )}
      {state.view === 'reviewing' && state.frozen && (
        <Reviewing
          project={state.frozen.project}
          codebook={state.frozen.codebook}
          excerpts={state.frozen.humanCoding}
          reviewerMode={state.reviewerMode}
          consent={state.providerConsent}
          requestId={state.reviewRequestId}
          remoteRequestStarted={state.remoteRequestStarted}
          onRemoteStart={() => patchState({ remoteRequestStarted: true })}
          onPrepareRetry={() => patchState({ remoteRequestStarted: false })}
          onUseLocalFallback={() => patchState({
            reviewerMode: 'mock',
            providerConsent: null,
            remoteRequestStarted: false,
          })}
          onDone={completeReview}
        />
      )}
      {state.view === 'queue' && (
        <ReviewQueue
          project={activeProject}
          codebook={activeCodebook}
          excerpts={activeExcerpts}
          reviews={state.reviews}
          resolutions={state.resolutions}
          onOpenCase={openCase}
          onOpenAudit={() => patchState({ view: 'audit' })}
        />
      )}
      {state.view === 'case' && selectedHuman && selectedAi && (
        <CaseResolution
          key={selectedHuman.excerpt_id}
          project={activeProject}
          codebook={activeCodebook}
          human={selectedHuman}
          excerpts={activeExcerpts}
          ai={selectedAi}
          existing={selectedResolution}
          existingCodebookChange={selectedCodebookChange}
          onBack={() => patchState({ view: 'queue', selectedExcerptId: null })}
          onSave={saveResolution}
        />
      )}
      {state.view === 'audit' && state.frozen && (
        <Audit
          project={state.frozen.project}
          codebook={state.frozen.codebook}
          excerpts={state.frozen.humanCoding}
          frozen={state.frozen}
          reviews={state.reviews}
          resolutions={state.resolutions}
          codebookChanges={state.codebookChanges}
          onBack={() => patchState({ view: 'queue' })}
          onOpenCase={openCase}
        />
      )}
      </Shell>
      {localDataDialog}
    </>
  )
}
