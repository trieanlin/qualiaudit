import type { SpreadsheetImportKind } from './spreadsheet'

export type ImportProfileId =
  | 'nvivo-codebook'
  | 'nvivo-coding-report'
  | 'maxqda-retrieved-segments'
  | 'atlasti-quotation-report'

export interface ImportProfile {
  id: ImportProfileId
  label: string
  tool: 'NVivo' | 'MAXQDA' | 'ATLAS.ti'
  kind: SpreadsheetImportKind
  description: string
  signals: string[][]
  minimumSignals: number
  fieldAliases: Record<string, string[]>
}

export function normalizeImportHeader(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[\s\p{P}\p{S}]+/gu, '')
}

export const IMPORT_PROFILES: ImportProfile[] = [
  {
    id: 'nvivo-codebook',
    label: 'NVivo codebook',
    tool: 'NVivo',
    kind: 'codebook',
    description: 'Suggests mappings for an Excel codebook that includes code names, descriptions, and reference counts.',
    signals: [
      ['name', 'code name', 'node name'],
      ['description'],
      ['files', 'sources'],
      ['references'],
    ],
    minimumSignals: 3,
    fieldAliases: {
      code: ['name', 'code name', 'node name'],
      definition: ['description', 'code description', 'node description'],
    },
  },
  {
    id: 'nvivo-coding-report',
    label: 'NVivo coding report',
    tool: 'NVivo',
    kind: 'excerpts',
    description: 'Suggests mappings only when a coding report exposes a reference identifier, source, code, and coded text as columns.',
    signals: [
      ['coding reference', 'reference number', 'reference id'],
      ['coded text', 'coded content', 'reference content'],
      ['file name', 'source name', 'file', 'source'],
      ['code name', 'node name', 'code', 'node'],
    ],
    minimumSignals: 3,
    fieldAliases: {
      excerpt_id: ['coding reference', 'reference number', 'reference id'],
      source_id: ['file name', 'source name', 'file', 'source'],
      excerpt: ['coded text', 'coded content', 'reference content'],
      human_code: ['code name', 'node name', 'code', 'node'],
      human_rationale: ['annotation', 'memo'],
    },
  },
  {
    id: 'maxqda-retrieved-segments',
    label: 'MAXQDA retrieved segments',
    tool: 'MAXQDA',
    kind: 'excerpts',
    description: 'Suggests mappings for an Excel export of retrieved or coded segments with source information.',
    signals: [
      ['document name', 'document'],
      ['coded segment', 'retrieved segment', 'segment'],
      ['code name', 'code'],
      ['comment', 'coding comment', 'memo'],
    ],
    minimumSignals: 3,
    fieldAliases: {
      excerpt_id: ['segment id', 'coding id'],
      source_id: ['document name', 'document'],
      excerpt: ['coded segment', 'retrieved segment', 'segment'],
      context: ['source information', 'position', 'start', 'end'],
      human_code: ['code name', 'code'],
      human_rationale: ['comment', 'coding comment', 'memo'],
    },
  },
  {
    id: 'atlasti-quotation-report',
    label: 'ATLAS.ti quotation report',
    tool: 'ATLAS.ti',
    kind: 'excerpts',
    description: 'Suggests mappings for a quotation Excel report containing ID, document, quotation content, codes, and reference.',
    signals: [
      ['id', 'quotation id'],
      ['document'],
      ['quotation content'],
      ['codes'],
      ['reference'],
    ],
    minimumSignals: 4,
    fieldAliases: {
      excerpt_id: ['id', 'quotation id'],
      source_id: ['document'],
      excerpt: ['quotation content'],
      context: ['reference'],
      human_code: ['codes', 'code'],
      human_rationale: ['quotation comment', 'comment'],
    },
  },
]

export function profilesForImport(kind: SpreadsheetImportKind): ImportProfile[] {
  return IMPORT_PROFILES.filter((profile) => profile.kind === kind)
}

export function getImportProfile(id: ImportProfileId): ImportProfile {
  const profile = IMPORT_PROFILES.find((item) => item.id === id)
  if (!profile) throw new Error(`Unknown import profile: ${id}`)
  return profile
}

export function detectImportProfile(headers: string[], kind: SpreadsheetImportKind): ImportProfile | null {
  const normalizedHeaders = new Set(headers.map(normalizeImportHeader).filter(Boolean))
  const candidates = profilesForImport(kind)
    .map((profile) => ({
      profile,
      matchedSignals: profile.signals.filter((signal) => (
        signal.some((label) => normalizedHeaders.has(normalizeImportHeader(label)))
      )).length,
    }))
    .filter(({ profile, matchedSignals }) => matchedSignals >= profile.minimumSignals)
    .sort((left, right) => right.matchedSignals - left.matchedSignals)

  if (!candidates[0]) return null
  if (candidates[1] && candidates[0].matchedSignals === candidates[1].matchedSignals) return null
  return candidates[0].profile
}

