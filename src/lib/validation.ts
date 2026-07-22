import type { CodeDefinition, HumanCodedExcerpt, ValidationIssue } from '../types'

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
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

    const normalizedCode = row.code.trim().toLowerCase()
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
  const seenIds = new Set<string>()

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
      issues.push({ level: 'error', row: rowNumber, field: 'human_code', message: 'Human code is not present in the codebook.' })
    }
  })

  return issues
}
