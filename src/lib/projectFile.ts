import type { ReviewState } from '../hooks/useReviewState'
import type {
  AiReview,
  AppView,
  CodeDefinition,
  Confidence,
  FrozenSnapshot,
  HumanCodedExcerpt,
  ProjectBrief,
  ProviderConsent,
  Resolution,
  ResolutionDecision,
  ReviewerMode,
} from '../types'
import { REVIEWER_CONSENT_VERSION } from './reviewerProtocol'

export const PROJECT_FILE_FORMAT = 'qualiaudit-project'
export const PROJECT_FILE_SCHEMA_VERSION = 1
export const MAX_PROJECT_FILE_SIZE = 20 * 1024 * 1024

const APP_VIEWS = new Set<AppView>(['landing', 'setup', 'materials', 'freeze', 'reviewing', 'queue', 'case', 'audit'])
const CONFIDENCE_VALUES = new Set<Confidence>(['low', 'medium', 'high'])
const RESOLUTION_DECISIONS = new Set<ResolutionDecision>([
  'keep_original',
  'accept_ai',
  'keep_both',
  'revise_code',
  'revise_boundary',
  'revise_codebook',
  'discuss',
  'unresolved',
  'reject_ai',
])
export interface PortableProjectFile {
  format: typeof PROJECT_FILE_FORMAT
  schema_version: typeof PROJECT_FILE_SCHEMA_VERSION
  exported_at: string
  application: {
    name: 'QualiAudit'
    version: string
  }
  state: ReviewState
}

export class ProjectFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectFileError'
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ProjectFileError(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new ProjectFileError(`${label} must be an array.`)
  return value
}

function text(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && value.trim().length === 0)) {
    throw new ProjectFileError(`${label} must be ${allowEmpty ? 'text' : 'non-empty text'}.`)
  }
  return value
}

function optionalText(value: unknown, label: string): string | undefined {
  if (value == null) return undefined
  return text(value, label, true) || undefined
}

function isoDate(value: unknown, label: string): string {
  const result = text(value, label)
  if (Number.isNaN(Date.parse(result))) throw new ProjectFileError(`${label} must be a valid date.`)
  return result
}

function parseProject(value: unknown, label = 'Project'): ProjectBrief {
  const item = record(value, label)
  const analysisMode = text(item.analysisMode, `${label} analysis mode`)
  if (analysisMode !== 'codebook' && analysisMode !== 'reflexive') {
    throw new ProjectFileError(`${label} uses an unsupported analysis mode.`)
  }
  return {
    id: text(item.id, `${label} ID`),
    name: text(item.name, `${label} name`),
    researchQuestion: text(item.researchQuestion, `${label} research question`),
    analysisMode,
    aiRole: text(item.aiRole, `${label} AI role`),
    createdAt: isoDate(item.createdAt, `${label} creation date`),
  }
}

function parseCodeDefinition(value: unknown, index: number): CodeDefinition {
  const label = `Codebook row ${index + 1}`
  const item = record(value, label)
  return {
    code: text(item.code, `${label} code`),
    definition: text(item.definition, `${label} definition`, true),
    include_when: text(item.include_when, `${label} inclusion guidance`, true),
    exclude_when: text(item.exclude_when, `${label} exclusion guidance`, true),
    ...(optionalText(item.example, `${label} example`) ? { example: optionalText(item.example, `${label} example`) } : {}),
  }
}

function parseExcerpt(value: unknown, index: number, labelPrefix = 'Excerpt'): HumanCodedExcerpt {
  const label = `${labelPrefix} ${index + 1}`
  const item = record(value, label)
  const confidence = optionalText(item.human_confidence, `${label} human confidence`)
  if (confidence && !CONFIDENCE_VALUES.has(confidence as Confidence)) {
    throw new ProjectFileError(`${label} has an unsupported human confidence value.`)
  }
  return {
    excerpt_id: text(item.excerpt_id, `${label} ID`),
    source_id: text(item.source_id, `${label} source ID`),
    excerpt: text(item.excerpt, `${label} text`),
    context: optionalText(item.context, `${label} context`),
    human_code: text(item.human_code, `${label} human code`),
    human_rationale: optionalText(item.human_rationale, `${label} human rationale`),
    human_confidence: confidence as Confidence | undefined,
    second_coder_code: optionalText(item.second_coder_code, `${label} second-coder code`),
    second_coder_rationale: optionalText(item.second_coder_rationale, `${label} second-coder rationale`),
  }
}

function parseSnapshot(value: unknown): FrozenSnapshot {
  const item = record(value, 'Frozen snapshot')
  return {
    frozenAt: isoDate(item.frozenAt, 'Frozen snapshot date'),
    project: parseProject(item.project, 'Frozen project'),
    codebook: array(item.codebook, 'Frozen codebook').map(parseCodeDefinition),
    humanCoding: array(item.humanCoding, 'Frozen human coding').map((row, index) => parseExcerpt(row, index, 'Frozen excerpt')),
  }
}

function parseReview(value: unknown, index: number): AiReview {
  const label = `AI review ${index + 1}`
  const item = record(value, label)
  const uncertainty = text(item.uncertainty, `${label} uncertainty`)
  if (!CONFIDENCE_VALUES.has(uncertainty as Confidence)) {
    throw new ProjectFileError(`${label} has an unsupported uncertainty value.`)
  }
  if (item.reviewer !== 'deterministic-mock-v0.1' && item.reviewer !== 'openai-responses-v0.2') {
    throw new ProjectFileError(`${label} uses an unsupported reviewer version.`)
  }
  if (typeof item.needs_more_context !== 'boolean') {
    throw new ProjectFileError(`${label} needs_more_context must be true or false.`)
  }
  const provider = optionalText(item.provider, `${label} provider`)
  if (provider && provider !== 'local-mock' && provider !== 'openai') {
    throw new ProjectFileError(`${label} uses an unsupported provider.`)
  }
  const destination = optionalText(item.data_destination, `${label} data destination`)
  if (destination && destination !== 'local-browser' && destination !== 'openai-api') {
    throw new ProjectFileError(`${label} uses an unsupported data destination.`)
  }
  const consentVersion = optionalText(item.consent_version, `${label} consent version`)
  if (consentVersion && consentVersion !== REVIEWER_CONSENT_VERSION) {
    throw new ProjectFileError(`${label} uses an unsupported consent version.`)
  }
  return {
    excerpt_id: text(item.excerpt_id, `${label} excerpt ID`),
    primary_suggested_code: text(item.primary_suggested_code, `${label} primary code`),
    alternative_code: optionalText(item.alternative_code, `${label} alternative code`),
    evidence_quote: text(item.evidence_quote, `${label} evidence quote`, true),
    rationale: text(item.rationale, `${label} rationale`),
    uncertainty: uncertainty as Confidence,
    needs_more_context: item.needs_more_context,
    possible_codebook_issue: optionalText(item.possible_codebook_issue, `${label} codebook issue`),
    reviewer: item.reviewer,
    provider: provider as AiReview['provider'],
    model: optionalText(item.model, `${label} model`),
    prompt_version: optionalText(item.prompt_version, `${label} prompt version`),
    data_destination: destination as AiReview['data_destination'],
    consent_version: consentVersion as AiReview['consent_version'],
    reviewed_at: isoDate(item.reviewed_at, `${label} review date`),
  }
}

function parseProviderConsent(value: unknown): ProviderConsent | null {
  if (value == null) return null
  const item = record(value, 'Provider consent')
  if (item.version !== REVIEWER_CONSENT_VERSION || item.provider !== 'openai') {
    throw new ProjectFileError('Provider consent uses an unsupported version or provider.')
  }
  if (!Array.isArray(item.exactFields) || item.exactFields.some((field) => typeof field !== 'string')) {
    throw new ProjectFileError('Provider consent must record the exact fields disclosed.')
  }
  return {
    version: REVIEWER_CONSENT_VERSION,
    provider: 'openai',
    grantedAt: isoDate(item.grantedAt, 'Provider consent date'),
    exactFields: item.exactFields.map((field) => text(field, 'Provider consent field')),
  }
}

function parseResolution(value: unknown, index: number): Resolution {
  const label = `Resolution ${index + 1}`
  const item = record(value, label)
  const decision = text(item.decision, `${label} decision`)
  if (!RESOLUTION_DECISIONS.has(decision as ResolutionDecision)) {
    throw new ProjectFileError(`${label} has an unsupported decision.`)
  }
  if (typeof item.changed_after_ai_exposure !== 'boolean') {
    throw new ProjectFileError(`${label} changed-after-exposure flag must be true or false.`)
  }
  return {
    excerpt_id: text(item.excerpt_id, `${label} excerpt ID`),
    decision: decision as ResolutionDecision,
    rationale: text(item.rationale, `${label} rationale`),
    final_code: optionalText(item.final_code, `${label} final code`),
    decided_at: isoDate(item.decided_at, `${label} decision date`),
    changed_after_ai_exposure: item.changed_after_ai_exposure,
  }
}

function uniqueIds(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new ProjectFileError(`${label} contains duplicate IDs.`)
}

function resumeView(state: ReviewState): AppView {
  if (state.frozen && state.reviews.length === 0) return 'reviewing'
  if (state.reviews.length > 0) {
    if (state.view === 'audit') return 'audit'
    if (state.view === 'case' && state.selectedExcerptId) return 'case'
    return 'queue'
  }
  if (state.frozen) return 'materials'
  return state.view === 'setup' ? 'setup' : 'materials'
}

function parseState(value: unknown): ReviewState {
  const item = record(value, 'Project state')
  const project = parseProject(item.project)
  const codebook = array(item.codebook, 'Codebook').map(parseCodeDefinition)
  const excerpts = array(item.excerpts, 'Human-coded excerpts').map((row, index) => parseExcerpt(row, index))
  const frozen = item.frozen == null ? null : parseSnapshot(item.frozen)
  const reviews = array(item.reviews, 'AI reviews').map(parseReview)
  const resolutions = array(item.resolutions, 'Resolutions').map(parseResolution)
  const rawView = text(item.view, 'Saved view')
  if (!APP_VIEWS.has(rawView as AppView)) throw new ProjectFileError('The saved view is not supported.')
  const selectedExcerptId = item.selectedExcerptId == null ? null : text(item.selectedExcerptId, 'Selected excerpt ID')
  const reviewerMode: ReviewerMode = item.reviewerMode === 'openai' ? 'openai' : 'mock'
  const providerConsent = parseProviderConsent(item.providerConsent)
  const reviewRequestId = item.reviewRequestId == null ? null : text(item.reviewRequestId, 'Review request ID')
  const remoteRequestStarted = item.remoteRequestStarted === true

  uniqueIds(codebook.map((row) => row.code), 'Codebook')
  uniqueIds(excerpts.map((row) => row.excerpt_id), 'Human-coded excerpts')
  uniqueIds(reviews.map((row) => row.excerpt_id), 'AI reviews')
  uniqueIds(resolutions.map((row) => row.excerpt_id), 'Resolutions')

  const activeExcerptIds = new Set((frozen?.humanCoding ?? excerpts).map((row) => row.excerpt_id))
  if (reviews.some((review) => !activeExcerptIds.has(review.excerpt_id))) {
    throw new ProjectFileError('An AI review refers to an excerpt that is not in the frozen record.')
  }
  if (resolutions.some((resolution) => !activeExcerptIds.has(resolution.excerpt_id))) {
    throw new ProjectFileError('A resolution refers to an excerpt that is not in the frozen record.')
  }
  if (reviews.length > 0 && !frozen) {
    throw new ProjectFileError('AI reviews are present without a frozen human interpretation.')
  }
  if (resolutions.length > 0 && reviews.length === 0) {
    throw new ProjectFileError('Resolutions are present without an independent review.')
  }

  const parsed: ReviewState = {
    view: rawView as AppView,
    project,
    codebook,
    excerpts,
    frozen,
    reviews,
    resolutions,
    selectedExcerptId,
    reviewerMode,
    providerConsent,
    reviewRequestId,
    remoteRequestStarted,
  }
  parsed.view = resumeView(parsed)
  if (parsed.view !== 'case' || !selectedExcerptId || !activeExcerptIds.has(selectedExcerptId)) {
    parsed.selectedExcerptId = null
    if (parsed.view === 'case') parsed.view = 'queue'
  }
  return parsed
}

export function buildPortableProjectFile(state: ReviewState, exportedAt = new Date().toISOString()): PortableProjectFile {
  if (!state.project) throw new ProjectFileError('There is no project to save.')
  return {
    format: PROJECT_FILE_FORMAT,
    schema_version: PROJECT_FILE_SCHEMA_VERSION,
    exported_at: exportedAt,
    application: {
      name: 'QualiAudit',
      version: '0.1.0',
    },
    state: structuredClone(state),
  }
}

export function serialisePortableProject(state: ReviewState, exportedAt?: string): string {
  return JSON.stringify(buildPortableProjectFile(state, exportedAt), null, 2)
}

export function parsePortableProjectFile(source: string): PortableProjectFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    throw new ProjectFileError('This file is not valid JSON.')
  }

  const file = record(parsed, 'Project file')
  if (file.format !== PROJECT_FILE_FORMAT) {
    throw new ProjectFileError('This is not a QualiAudit project file. Audit JSON exports cannot be resumed.')
  }
  if (file.schema_version !== PROJECT_FILE_SCHEMA_VERSION) {
    throw new ProjectFileError(`This project-file version is not supported. Expected version ${PROJECT_FILE_SCHEMA_VERSION}.`)
  }
  const application = record(file.application, 'Application metadata')
  if (application.name !== 'QualiAudit') throw new ProjectFileError('The project file has invalid application metadata.')

  return {
    format: PROJECT_FILE_FORMAT,
    schema_version: PROJECT_FILE_SCHEMA_VERSION,
    exported_at: isoDate(file.exported_at, 'Project export date'),
    application: {
      name: 'QualiAudit',
      version: text(application.version, 'Application version'),
    },
    state: parseState(file.state),
  }
}

export function projectFileName(projectName: string): string {
  const stem = projectName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return `${stem || 'qualiaudit-review'}.qualiaudit.json`
}
