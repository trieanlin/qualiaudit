import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Cloud,
  Database,
  EyeOff,
  FileLock2,
  HardDrive,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  fetchReviewerProviderConfig,
  RemoteReviewerError,
  runOpenAiBlindReview,
} from '../lib/remoteReviewer'
import { buildBlindReviewPayload, runMockBlindReview } from '../lib/reviewer'
import type { ReviewerProviderConfig } from '../lib/reviewerProtocol'
import type {
  AiReview,
  CodeDefinition,
  HumanCodedExcerpt,
  ProjectBrief,
  ProviderConsent,
  ReviewerMode,
} from '../types'

interface FreezeProps {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  onBack: () => void
  onFreeze: (reviewerMode: ReviewerMode) => void
}

export function FreezeReview({ project, codebook, excerpts, onBack, onFreeze }: FreezeProps) {
  const [reviewerMode, setReviewerMode] = useState<ReviewerMode>('mock')
  const [consented, setConsented] = useState(false)
  const [providerConfig, setProviderConfig] = useState<ReviewerProviderConfig | null>(null)
  const [configError, setConfigError] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const showHeading = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      headingRef.current?.focus({ preventScroll: true })
    }
    showHeading()
    const timer = window.setTimeout(showHeading, 250)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (reviewerMode !== 'openai' || providerConfig || configError) return
    const controller = new AbortController()
    void fetchReviewerProviderConfig(controller.signal)
      .then(setProviderConfig)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setConfigError(true)
      })
    return () => controller.abort()
  }, [configError, providerConfig, reviewerMode])

  const remoteReady = Boolean(providerConfig?.configured && consented)
  const canStart = reviewerMode === 'mock' || remoteReady

  return (
    <div className="page narrow-page freeze-page">
      <button className="text-button back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to materials</button>
      <div className="freeze-symbol" aria-hidden="true"><FileLock2 /></div>
      <div className="page-heading centered-heading">
        <span className="overline">BLIND REVIEW CHECKPOINT</span>
        <h1 ref={headingRef} tabIndex={-1}>Freeze the human interpretation.</h1>
        <p>This creates a time-stamped first-pass record before the independent reading is generated.</p>
      </div>

      <section className="freeze-card">
        <div className="freeze-statement">
          <EyeOff size={21} />
          <div>
            <strong>Your initial interpretation will be saved.</strong>
            <p>The reviewer will not see your human codes.</p>
          </div>
        </div>
        <div className="blind-columns">
          <div>
            <h2><Check size={16} /> Reviewer can see</h2>
            <ul>
              <li>Research question and intended AI role</li>
              <li>{project.analysisMode === 'reflexive' ? 'Reflexive analysis framing' : 'Codebook / framework analysis framing'}</li>
              <li>{codebook.length} code definitions and guidance</li>
              <li>Excerpt/source IDs, text, and necessary context</li>
            </ul>
          </div>
          <div className="withheld-column">
            <h2><EyeOff size={16} /> Withheld from reviewer</h2>
            <ul>
              <li>Human and second-coder codes</li>
              <li>Human rationales and confidence</li>
              <li>Any later final decisions</li>
              <li>Resolution history</li>
            </ul>
          </div>
        </div>
        <div className="freeze-record"><Database size={16} /><span><strong>Snapshot contents</strong>{excerpts.length} excerpts · {codebook.length} codes · project brief</span></div>
      </section>

      <fieldset className="reviewer-choice">
        <legend>Choose how to create the independent reading</legend>
        <label className={reviewerMode === 'mock' ? 'reviewer-option selected' : 'reviewer-option'}>
          <input
            type="radio"
            name="reviewer-mode"
            value="mock"
            checked={reviewerMode === 'mock'}
            onChange={() => {
              setReviewerMode('mock')
              setConsented(false)
            }}
          />
          <span className="reviewer-option-icon"><HardDrive /></span>
          <span>
            <strong>Local deterministic reviewer <em>Recommended for the demo</em></strong>
            <small>Runs entirely in this browser. No excerpt or context is sent to a third party, and no API key is needed.</small>
          </span>
        </label>
        <label className={reviewerMode === 'openai' ? 'reviewer-option selected' : 'reviewer-option'}>
          <input
            type="radio"
            name="reviewer-mode"
            value="openai"
            checked={reviewerMode === 'openai'}
            onChange={() => setReviewerMode('openai')}
          />
          <span className="reviewer-option-icon remote"><Cloud /></span>
          <span>
            <strong>OpenAI reviewer <em>Optional · server-side</em></strong>
            <small>Sends the blind allowlisted payload through this deployment’s backend. The API key never enters the browser.</small>
          </span>
        </label>
      </fieldset>

      {reviewerMode === 'mock' ? (
        <div className="third-party-note"><ShieldCheck size={18} /><span><strong>No third-party transmission.</strong> The deterministic reviewer uses only the visible blind-review fields on this device.</span></div>
      ) : (
        <section className="provider-disclosure" aria-live="polite">
          <div className="provider-disclosure-heading">
            <Cloud />
            <div><span className="overline">BEFORE ANY DATA IS SENT</span><h2>Review the provider boundary.</h2></div>
          </div>
          <dl>
            <div><dt>Provider</dt><dd>OpenAI API</dd></div>
            <div><dt>Model</dt><dd>{providerConfig?.model ?? (configError ? 'Could not check' : 'Checking deployment…')}</dd></div>
            <div><dt>Processing region</dt><dd>{providerConfig?.region ?? (configError ? 'Could not check' : 'Checking deployment…')}</dd></div>
            <div><dt>Retention</dt><dd>{providerConfig?.retention ?? (configError ? 'Could not check' : 'Checking deployment…')}</dd></div>
            <div><dt>Response storage</dt><dd>QualiAudit requests <code>store=false</code></dd></div>
            <div><dt>Prompt / schema</dt><dd>{providerConfig ? `${providerConfig.promptVersion} / ${providerConfig.schemaVersion}` : configError ? 'Could not check' : 'Checking deployment…'}</dd></div>
            <div><dt>Server timeout</dt><dd>{providerConfig ? `${Math.round(providerConfig.requestTimeoutMs / 1_000)} seconds; no automatic retry` : configError ? 'Could not check' : 'Checking deployment…'}</dd></div>
          </dl>
          <p>
            OpenAI states API data is not used to train models by default. Default abuse-monitoring logs may retain
            content for up to 30 days unless approved data controls apply. Verify your institution’s requirements and
            this deployment’s provider account before using governed research data.{' '}
            <a href="https://platform.openai.com/docs/models/default-usage-policies-by-endpoint" target="_blank" rel="noreferrer">Read the provider data-controls documentation</a>.
          </p>
          {providerConfig && !providerConfig.configured && (
            <div className="provider-status warning"><AlertTriangle /><span><strong>Real review is not configured on this deployment.</strong> No key or model is available server-side. Choose the local reviewer to continue.</span></div>
          )}
          {configError && (
            <div className="provider-status warning"><AlertTriangle /><span><strong>Configuration could not be checked.</strong> No review data has been sent. Choose the local reviewer to continue.</span></div>
          )}
          <label className="consent-check">
            <input
              type="checkbox"
              checked={consented}
              disabled={!providerConfig?.configured}
              onChange={(event) => setConsented(event.target.checked)}
            />
            <span>
              <strong>I choose to send only the fields listed above to OpenAI for this review.</strong>
              I understand that excerpts and context may contain research data, and that AI remains advisory.
            </span>
          </label>
        </section>
      )}

      <button
        className="button primary large centered-button"
        type="button"
        disabled={!canStart}
        onClick={() => onFreeze(reviewerMode)}
      >
        {reviewerMode === 'mock' ? 'Freeze & run local blind review' : 'Freeze & send blind payload'} <ArrowRight size={18} />
      </button>
    </div>
  )
}

interface ReviewingProps {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  reviewerMode: ReviewerMode
  consent: ProviderConsent | null
  requestId: string | null
  remoteRequestStarted: boolean
  onRemoteStart: () => void
  onPrepareRetry: () => void
  onUseLocalFallback: () => void
  onDone: (reviews: AiReview[]) => void
}

export function Reviewing({
  project,
  codebook,
  excerpts,
  reviewerMode,
  consent,
  requestId,
  remoteRequestStarted,
  onRemoteStart,
  onPrepareRetry,
  onUseLocalFallback,
  onDone,
}: ReviewingProps) {
  const [processed, setProcessed] = useState(0)
  const [remoteStatus, setRemoteStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [remoteIssue, setRemoteIssue] = useState<{
    message: string
    code: string
    requestId?: string
    providerRequestId?: string
  } | null>(null)
  const [retrySeconds, setRetrySeconds] = useState(0)
  const finished = useRef(false)
  const requested = useRef(false)

  useEffect(() => {
    if (retrySeconds <= 0) return
    const timer = window.setTimeout(() => setRetrySeconds((current) => Math.max(0, current - 1)), 1_000)
    return () => window.clearTimeout(timer)
  }, [retrySeconds])

  useEffect(() => {
    if (reviewerMode !== 'mock') return
    const payload = buildBlindReviewPayload(project, codebook, excerpts)
    const reviews = runMockBlindReview(payload)
    const interval = window.setInterval(() => {
      setProcessed((current) => {
        const next = Math.min(excerpts.length, current + Math.max(1, Math.ceil(excerpts.length / 4)))
        if (next === excerpts.length && !finished.current) {
          finished.current = true
          window.clearInterval(interval)
          window.setTimeout(() => onDone(reviews), 450)
        }
        return next
      })
    }, 260)
    return () => window.clearInterval(interval)
  }, [codebook, excerpts, onDone, project, reviewerMode])

  useEffect(() => {
    if (
      reviewerMode !== 'openai'
      || requested.current
      || remoteRequestStarted
      || !consent
      || !requestId
    ) return
    requested.current = true
    setRemoteStatus('sending')
    setRemoteIssue(null)
    setRetrySeconds(0)
    onRemoteStart()
    const payload = buildBlindReviewPayload(project, codebook, excerpts)
    void runOpenAiBlindReview(payload, requestId)
      .then((reviews) => {
        setProcessed(excerpts.length)
        window.setTimeout(() => onDone(reviews), 350)
      })
      .catch((error: unknown) => {
        setRemoteStatus('error')
        if (error instanceof RemoteReviewerError) {
          setRemoteIssue({
            message: error.message,
            code: error.code,
            requestId: error.requestId,
            providerRequestId: error.providerRequestId,
          })
          setRetrySeconds(error.retryAfterSeconds ?? 0)
          return
        }
        setRemoteIssue({
          message: error instanceof Error ? error.message : 'The independent reviewer did not complete.',
          code: 'unknown_error',
        })
      })
  }, [
    codebook,
    consent,
    excerpts,
    onDone,
    onRemoteStart,
    project,
    remoteRequestStarted,
    requestId,
    reviewerMode,
  ])

  const retry = () => {
    if (retrySeconds > 0) return
    requested.current = false
    setRemoteStatus('idle')
    setRemoteIssue(null)
    onPrepareRetry()
  }
  const interrupted = reviewerMode === 'openai' && remoteRequestStarted && remoteStatus === 'idle'
  const missingConsent = reviewerMode === 'openai' && (!consent || !requestId)
  const percentage = excerpts.length ? Math.round((processed / excerpts.length) * 100) : 0
  const hasRemoteProblem = remoteStatus === 'error' || interrupted || missingConsent

  return (
    <div className="reviewing-page" aria-live="polite">
      <div className="review-orbit" aria-hidden="true"><span /><span /><EyeOff /></div>
      <span className="overline">INDEPENDENT REVIEW {hasRemoteProblem ? 'PAUSED' : 'IN PROGRESS'}</span>
      <h1>{hasRemoteProblem ? 'No silent retry.' : 'Creating a separate reading.'}</h1>
      <p>
        {reviewerMode === 'mock'
          ? 'The local reviewer is working from the project framing, codebook, excerpt, and context only.'
          : hasRemoteProblem
            ? 'The remote attempt did not produce a saved review. QualiAudit will not resend research text without another action from you.'
            : 'The allowlisted blind payload is being processed by the configured OpenAI model through the server endpoint.'}
      </p>

      {hasRemoteProblem ? (
        <div className="remote-review-error">
          <AlertTriangle />
          <div>
            <strong>{missingConsent ? 'The consent record is missing.' : interrupted ? 'The earlier request was interrupted or its outcome is unknown.' : remoteIssue?.message}</strong>
            <p>Human codes, rationales, confidence, second-coder fields, and final decisions remain outside the provider payload.</p>
            {remoteIssue?.code === 'provider_rate_limited' && (
              <p>The provider asked this deployment to wait. No research text will be resent until you choose retry after the wait ends.</p>
            )}
            {(remoteIssue?.requestId || remoteIssue?.providerRequestId) && (
              <p className="support-reference">
                Support reference:
                {remoteIssue.requestId && <> client <code>{remoteIssue.requestId}</code></>}
                {remoteIssue.providerRequestId && <> · provider <code>{remoteIssue.providerRequestId}</code></>}
              </p>
            )}
          </div>
          <div>
            {!missingConsent && (
              <button className="button secondary" type="button" disabled={retrySeconds > 0} onClick={retry}>
                <RefreshCw size={15} /> {retrySeconds > 0 ? `Retry available in ${retrySeconds}s` : 'Retry remote review'}
              </button>
            )}
            <button className="button primary" type="button" onClick={onUseLocalFallback}><HardDrive size={15} /> Use local reviewer</button>
          </div>
        </div>
      ) : (
        <div className="progress-card">
          <div>
            <span>{reviewerMode === 'mock' ? 'Deterministic mock reviewer' : 'OpenAI server-side reviewer'}</span>
            <strong>{reviewerMode === 'mock' ? `${processed} / ${excerpts.length} excerpts` : remoteStatus === 'sending' ? 'Awaiting structured review' : 'Preparing request'}</strong>
          </div>
          <div className={reviewerMode === 'openai' ? 'progress-track indeterminate' : 'progress-track'}>
            <span style={reviewerMode === 'mock' ? { width: `${percentage}%` } : undefined} />
          </div>
          <small>
            {reviewerMode === 'mock'
              ? processed < excerpts.length ? 'Comparing textual evidence with code definitions…' : 'Independent readings recorded.'
              : 'The response must pass schema, codebook, excerpt-ID, and verbatim-evidence validation before it is saved.'}
          </small>
        </div>
      )}
      <div className="blind-reminder"><FileLock2 size={17} /> Human interpretation fields remain outside the review payload</div>
    </div>
  )
}
