import type { CodeDefinition, HumanCodedExcerpt, ValidationIssue } from '../types'

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function normalizeIdentifier(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en')
}

function normalizeExcerpt(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en')
}

function detectedKnownCodes(value: string, validCodes: Map<string, string>): string[] {
  const separators = [/\s*(?:;|\||\r?\n)\s*/, /\s*,\s*/]

  for (const separator of separators) {
    const candidates = value.split(separator).filter(Boolean)
    if (candidates.length > 1 && candidates.every((candidate) => validCodes.has(normalizeIdentifier(candidate)))) {
      return candidates.map((candidate) => validCodes.get(normalizeIdentifier(candidate)) ?? candidate)
    }
  }
  return []
}

export function validateCodebook(rows: CodeDefinition[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Map<string, number>()

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    ;(['code', 'definition', 'include_when', 'exclude_when'] as const).forEach((field) => {
      if (isBlank(row[field])) {
        issues.push({
          level: field === 'code' || field === 'definition' ? 'error' : 'warning',
          row: rowNumber,
          field,
          message: `${field.replace('_', ' ')} is missing.`,
        })
      }
    })

    const normalizedCode = normalizeIdentifier(row.code)
    if (normalizedCode) {
      const firstRow = seen.get(normalizedCode)
      if (firstRow) {
        issues.push({
          level: 'error',
          row: rowNumber,
          field: 'code',
          message: `Duplicate code; first used on row ${firstRow}.`,
        })
      } else {
        seen.set(normalizedCode, rowNumber)
      }
    }
  })

  return issues
}

export function validateExcerpts(rows: HumanCodedExcerpt[], codebook: CodeDefinition[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const validCodes = new Set(codebook.map((item) => item.code))
  const normalizedCodes = new Map(codebook.map((item) => [normalizeIdentifier(item.code), item.code]))
  const seenIds = new Set<string>()
  const earlierExcerpts: { row: number; source: string; text: string }[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    ;(['excerpt_id', 'source_id', 'excerpt', 'human_code'] as const).forEach((field) => {
      if (isBlank(row[field])) {
        issues.push({ level: 'error', row: rowNumber, field, message: `${field.replace('_', ' ')} is missing.` })
      }
    })

    if (seenIds.has(row.excerpt_id)) {
      issues.push({ level: 'error', row: rowNumber, field: 'excerpt_id', message: 'Duplicate excerpt id.' })
    }
    seenIds.add(row.excerpt_id)

    if (row.human_code && !validCodes.has(row.human_code)) {
      const multipleCodes = detectedKnownCodes(row.human_code, normalizedCodes)
      const normalizedMatch = normalizedCodes.get(normalizeIdentifier(row.human_code))
      const message = multipleCodes.length > 1
        ? `Multiple human codes detected (${multipleCodes.join(', ')}). Choose one primary code or split the record before freezing.`
        : normalizedMatch
          ? `Human code does not exactly match the codebook spelling “${normalizedMatch}”.`
          : 'Human code is not present in the codebook.'
      issues.push({ level: 'error', row: rowNumber, field: 'human_code', message })
    }

    if (row.second_coder_code && !validCodes.has(row.second_coder_code)) {
      const multipleCodes = detectedKnownCodes(row.second_coder_code, normalizedCodes)
      const normalizedMatch = normalizedCodes.get(normalizeIdentifier(row.second_coder_code))
      const message = multipleCodes.length > 1
        ? `Multiple second-coder codes detected (${multipleCodes.join(', ')}). The current field accepts one code.`
        : normalizedMatch
          ? `Second-coder code does not exactly match the codebook spelling “${normalizedMatch}”.`
          : 'Second-coder code is not present in the codebook.'
      issues.push({ level: 'error', row: rowNumber, field: 'second_coder_code', message })
    }

    const normalizedText = normalizeExcerpt(row.excerpt)
    const normalizedSource = normalizeIdentifier(row.source_id)
    if (normalizedText && normalizedSource) {
      const exact = earlierExcerpts.find((item) => item.source === normalizedSource && item.text === normalizedText)
      const overlap = exact ?? earlierExcerpts.find((item) => (
        item.source === normalizedSource
        && Math.min(item.text.length, normalizedText.length) >= 40
        && (item.text.includes(normalizedText) || normalizedText.includes(item.text))
      ))

      if (overlap) {
        issues.push({
          level: 'warning',
          row: rowNumber,
          field: 'excerpt',
          message: exact
            ? `Excerpt text duplicates row ${overlap.row}; check for an accidental duplicate or segment-boundary issue.`
            : `Excerpt overlaps row ${overlap.row} from the same source; check whether the segment boundaries are intentional.`,
        })
      }
      earlierExcerpts.push({ row: rowNumber, source: normalizedSource, text: normalizedText })
    }
  })

  return issues
}
