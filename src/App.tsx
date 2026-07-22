import { useCallback } from 'react'
import { Audit } from './components/Audit'
import { CaseResolution } from './components/CaseResolution'
import { FreezeReview, Reviewing } from './components/FreezeReview'
import { Landing } from './components/Landing'
import { Materials } from './components/Materials'
import { ReviewQueue } from './components/ReviewQueue'
import { Setup } from './components/Setup'
import { Shell } from './components/Shell'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from './data/sample'
import { useReviewState } from './hooks/useReviewState'
import type { AiReview, ProjectBrief, Resolution } from './types'

function cloneSample() {
  return {
    project: { ...SAMPLE_PROJECT },
    codebook: SAMPLE_CODEBOOK.map((item) => ({ ...item })),
    excerpts: SAMPLE_EXCERPTS.map((item) => ({ ...item })),
  }
}

export default function App() {
  const { state, patchState, reset } = useReviewState()

  const openSample = () => {
    const sample = cloneSample()
    patchState({ ...sample, view: 'materials', frozen: null, reviews: [], resolutions: [], selectedExcerptId: null })
  }

  const startSetup = () => {
    const sample = cloneSample()
    patchState({ ...sample, view: 'setup', frozen: null, reviews: [], resolutions: [], selectedExcerptId: null })
  }

  const handleReset = () => {
    if (state.view === 'landing' || window.confirm('Start over? This clears the locally saved demo review.')) reset()
  }

  const saveProject = (project: ProjectBrief) => patchState({ project, view: 'materials' })

  const freeze = () => {
    if (!state.project) return
    patchState({
      frozen: {
        frozenAt: new Date().toISOString(),
        project: { ...state.project },
        codebook: state.codebook.map((item) => ({ ...item })),
        humanCoding: state.excerpts.map((item) => ({ ...item })),
      },
      reviews: [],
      resolutions: [],
      view: 'reviewing',
    })
  }

  const completeReview = useCallback((reviews: AiReview[]) => {
    patchState({ reviews, view: 'queue' })
  }, [patchState])

  const openCase = (excerptId: string) => patchState({ selectedExcerptId: excerptId, view: 'case' })

  const saveResolution = (resolution: Resolution) => {
    const next = state.resolutions.filter((item) => item.excerpt_id !== resolution.excerpt_id)
    patchState({ resolutions: [...next, resolution], view: 'queue', selectedExcerptId: null })
  }

  const navigate = (view: typeof state.view) => patchState({ view, selectedExcerptId: null })

  if (state.view === 'landing' || !state.project) {
    return <Landing onOpenSample={openSample} onNewReview={startSetup} />
  }

  const activeProject = state.frozen?.project ?? state.project
  const activeCodebook = state.frozen?.codebook ?? state.codebook
  const activeExcerpts = state.frozen?.humanCoding ?? state.excerpts
  const selectedHuman = activeExcerpts.find((item) => item.excerpt_id === state.selectedExcerptId)
  const selectedAi = state.reviews.find((item) => item.excerpt_id === state.selectedExcerptId)
  const selectedResolution = state.resolutions.find((item) => item.excerpt_id === state.selectedExcerptId)

  return (
    <Shell
      view={state.view}
      project={activeProject}
      canReview={state.reviews.length > 0}
      canAudit={Boolean(state.frozen && state.reviews.length)}
      onNavigate={navigate}
      onReset={handleReset}
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
          ai={selectedAi}
          existing={selectedResolution}
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
          onBack={() => patchState({ view: 'queue' })}
          onOpenCase={openCase}
        />
      )}
    </Shell>
  )
}
