import type { ReviewState } from '../hooks/useReviewState'
import type {
  AiReview,
  AppView,
  CodebookChange,
  CodeDefinition,
  Confidence,
  FrozenSnapshot,
  HumanCodedExcerpt,
  ProjectBrief,
  ProviderConsent,
  ReflexiveMemo,
  Resolution,
  ResolutionDecision,
  ReviewerMode,
} from '../types'
import { REVIEWER_CONSENT_VERSION } from './reviewerProtocol'

export const PROJECT_FILE_FORMAT = 'qualiaudit-project'
export const PROJECT_FILE_SCHEMA_VERSION = 3
export const MAX_PROJECT_FILE_SIZE = 20 * 1024 * 1024
const SUPPORTED_PROJECT_FILE_VERSIONS = new Set([1, 2, PROJECT_FILE_SCHEMA_VERSION])

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

function textArray(value: unknown, label: string): string[] {
  return array(value, label).map((item, index) => text(item, `${label} item ${index + 1}`))
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

function parseCodeDefinition(value: unknown, index: number, customLabel?: string): CodeDefinition {
  const label = customLabel ?? `Codebook row ${index + 1}`
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
    codebook: array(item.codebook, 'Frozen codebook').map((row, index) => parseCodeDefinition(row, index)),
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
    schema_version: optionalText(item.schema_version, `${label} schema version`),
    data_destination: destination as AiReview['data_destination'],
    consent_version: consentVersion as AiReview['consent_version'],
    request_id: optionalText(item.request_id, `${label} request ID`),
    provider_request_id: optionalText(item.provider_request_id, `${label} provider request ID`),
    provider_response_id: optionalText(item.provider_response_id, `${label} provider response ID`),
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
    codebook_change_id: optionalText(item.codebook_change_id, `${label} codebook change ID`),
    decided_at: isoDate(item.decided_at, `${label} decision date`),
    changed_after_ai_exposure: item.changed_after_ai_exposure,
  }
}

function parseReflexiveMemo(value: unknown, index: number): ReflexiveMemo {
  const label = `Reflexive memo ${index + 1}`
  const item = record(value, label)
  if (item.memo_version !== 'qualiaudit-reflexive-memo-v0.1') {
    throw new ProjectFileError(`${label} uses an unsupported memo version.`)
  }
  const decision = text(item.decision, `${label} decision`)
  if (!RESOLUTION_DECISIONS.has(decision as ResolutionDecision)) {
    throw new ProjectFileError(`${label} has an unsupported linked decision.`)
  }
  return {
    memo_version: 'qualiaudit-reflexive-memo-v0.1',
    id: text(item.id, `${label} ID`),
    excerpt_id: text(item.excerpt_id, `${label} excerpt ID`),
    resolution_decided_at: isoDate(item.resolution_decided_at, `${label} linked decision date`),
    decision: decision as ResolutionDecision,
    author: text(item.author, `${label} author`),
    body: text(item.body, `${label} body`),
    created_at: isoDate(item.created_at, `${label} creation date`),
  }
}

function parseCodebookChange(value: unknown, index: number): CodebookChange {
  const label = `Codebook change ${index + 1}`
  const item = record(value, label)
  if (item.ledger_version !== 'qualiaudit-codebook-change-v0.1') {
    throw new ProjectFileError(`${label} uses an unsupported ledger version.`)
  }
  const code = text(item.code, `${label} code`)
  const before = parseCodeDefinition(item.before, 0, `${label} frozen definition`)
  const after = parseCodeDefinition(item.after, 0, `${label} proposed definition`)
  if (before.code !== code || after.code !== code) {
    throw new ProjectFileError(`${label} must use the same code before and after the proposed revision.`)
  }
  return {
    ledger_version: 'qualiaudit-codebook-change-v0.1',
    id: text(item.id, `${label} ID`),
    trigger_excerpt_id: text(item.trigger_excerpt_id, `${label} trigger excerpt ID`),
    code,
    before,
    after,
    author: text(item.author, `${label} author`),
    rationale: text(item.rationale, `${label} rationale`),
    created_at: isoDate(item.created_at, `${label} creation date`),
    affected_excerpt_ids: textArray(item.affected_excerpt_ids, `${label} affected excerpts`),
    unresolved_recode_excerpt_ids: textArray(
      item.unresolved_recode_excerpt_ids,
      `${label} unresolved recoding excerpts`,
    ),
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

function sameCodeDefinition(left: CodeDefinition, right: CodeDefinition): boolean {
  return left.code === right.code
    && left.definition === right.definition
    && left.include_when === right.include_when
    && left.exclude_when === right.exclude_when
    && (left.example ?? '') === (right.example ?? '')
}

function parseState(value: unknown, sourceSchemaVersion: number): ReviewState {
  const item = record(value, 'Project state')
  const project = parseProject(item.project)
  const codebook = array(item.codebook, 'Codebook').map((row, index) => parseCodeDefinition(row, index))
  const excerpts = array(item.excerpts, 'Human-coded excerpts').map((row, index) => parseExcerpt(row, index))
  const frozen = item.frozen == null ? null : parseSnapshot(item.frozen)
  const reviews = array(item.reviews, 'AI reviews').map(parseReview)
  const resolutions = array(item.resolutions, 'Resolutions').map(parseResolution)
  const reflexiveMemos = sourceSchemaVersion >= 3
    ? array(item.reflexiveMemos, 'Reflexive memos').map(parseReflexiveMemo)
    : []
  const codebookChanges = sourceSchemaVersion >= 2
    ? array(item.codebookChanges, 'Codebook changes').map(parseCodebookChange)
    : []
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
  uniqueIds(reflexiveMemos.map((row) => row.id), 'Reflexive memos')
  uniqueIds(codebookChanges.map((row) => row.id), 'Codebook changes')

  const activeExcerptIds = new Set((frozen?.humanCoding ?? excerpts).map((row) => row.excerpt_id))
  if (reviews.some((review) => !activeExcerptIds.has(review.excerpt_id))) {
    throw new ProjectFileError('An AI review refers to an excerpt that is not in the frozen record.')
  }
  if (resolutions.some((resolution) => !activeExcerptIds.has(resolution.excerpt_id))) {
    throw new ProjectFileError('A resolution refers to an excerpt that is not in the frozen record.')
  }
  if (reflexiveMemos.some((memo) => !activeExcerptIds.has(memo.excerpt_id))) {
    throw new ProjectFileError('A reflexive memo refers to an excerpt that is not in the frozen record.')
  }
  const resolutionExcerptIds = new Set(resolutions.map((resolution) => resolution.excerpt_id))
  if (reflexiveMemos.some((memo) => !resolutionExcerptIds.has(memo.excerpt_id))) {
    throw new ProjectFileError('A reflexive memo must refer to a case with a recorded human decision.')
  }
  const frozenCodebookByCode = new Map((frozen?.codebook ?? codebook).map((definition) => [definition.code, definition]))
  for (const change of codebookChanges) {
    if (!activeExcerptIds.has(change.trigger_excerpt_id)) {
      throw new ProjectFileError('A codebook change refers to a trigger excerpt that is not in the frozen record.')
    }
    uniqueIds(change.affected_excerpt_ids, `Codebook change ${change.id} affected excerpts`)
    uniqueIds(change.unresolved_recode_excerpt_ids, `Codebook change ${change.id} unresolved recoding excerpts`)
    if (change.affected_excerpt_ids.some((excerptId) => !activeExcerptIds.has(excerptId))) {
      throw new ProjectFileError('A codebook change refers to an affected excerpt that is not in the frozen record.')
    }
    if (change.unresolved_recode_excerpt_ids.some((excerptId) => !change.affected_excerpt_ids.includes(excerptId))) {
      throw new ProjectFileError('Unresolved recoding work must be a subset of the affected excerpts.')
    }
    const frozenDefinition = frozenCodebookByCode.get(change.code)
    if (!frozenDefinition || !sameCodeDefinition(change.before, frozenDefinition)) {
      throw new ProjectFileError('A codebook change does not match the frozen codebook baseline.')
    }
    if (sameCodeDefinition(change.before, change.after)) {
      throw new ProjectFileError('A codebook change must contain a proposed revision.')
    }
  }
  const codebookChangeById = new Map(codebookChanges.map((change) => [change.id, change]))
  for (const resolution of resolutions) {
    if (!resolution.codebook_change_id) continue
    const change = codebookChangeById.get(resolution.codebook_change_id)
    if (
      resolution.decision !== 'revise_codebook'
      || !change
      || change.trigger_excerpt_id !== resolution.excerpt_id
    ) {
      throw new ProjectFileError('A resolution refers to an invalid codebook-change event.')
    }
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
    reflexiveMemos,
    codebookChanges,
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
  if (typeof file.schema_version !== 'number' || !SUPPORTED_PROJECT_FILE_VERSIONS.has(file.schema_version)) {
    throw new ProjectFileError(`This project-file version is not supported. Expected version 1, 2, or ${PROJECT_FILE_SCHEMA_VERSION}.`)
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
    state: parseState(file.state, file.schema_version),
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
