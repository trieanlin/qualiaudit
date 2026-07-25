import readWorkbook, { type CellValue } from 'read-excel-file/browser'
import { normalizeImportHeader, type ImportProfile } from './importProfiles'

export type SpreadsheetImportKind = 'codebook' | 'excerpts'

export interface ImportField {
  key: string
  label: string
  required: boolean
  aliases: string[]
}

export interface WorkbookSheet {
  name: string
  rows: string[][]
}

export interface ImportTable {
  headers: string[]
  rows: string[][]
}

export type ColumnMapping = Record<string, number | ''>
export type MappedImportRow = Record<string, string>

export const CODEBOOK_IMPORT_FIELDS: ImportField[] = [
  { key: 'code', label: 'Code', required: true, aliases: ['code', 'code_name', 'name', '代码', '编码'] },
  { key: 'definition', label: 'Definition', required: true, aliases: ['definition', 'description', 'code_definition', '定义'] },
  { key: 'include_when', label: 'Include when', required: false, aliases: ['include_when', 'include', 'inclusion_criteria', '纳入标准'] },
  { key: 'exclude_when', label: 'Exclude when', required: false, aliases: ['exclude_when', 'exclude', 'exclusion_criteria', '排除标准'] },
  { key: 'example', label: 'Example', required: false, aliases: ['example', 'examples', 'exemplar', '示例'] },
]

export const EXCERPT_IMPORT_FIELDS: ImportField[] = [
  { key: 'excerpt_id', label: 'Excerpt ID', required: true, aliases: ['excerpt_id', 'segment_id', 'reference', 'id', '片段编号'] },
  { key: 'source_id', label: 'Source ID', required: true, aliases: ['source_id', 'source', 'document_id', 'document', 'file', '来源'] },
  { key: 'excerpt', label: 'Excerpt', required: true, aliases: ['excerpt', 'text', 'segment', 'quotation', 'quote', '片段', '文本'] },
  { key: 'context', label: 'Context', required: false, aliases: ['context', 'surrounding_text', '上下文'] },
  { key: 'human_code', label: 'Human code', required: true, aliases: ['human_code', 'code', 'codes', 'coding', '人工编码'] },
  { key: 'human_rationale', label: 'Human rationale', required: false, aliases: ['human_rationale', 'rationale', 'coding_rationale', 'memo', '编码理由'] },
  { key: 'human_confidence', label: 'Human confidence', required: false, aliases: ['human_confidence', 'confidence', 'coder_confidence', '置信度'] },
  { key: 'second_coder_code', label: 'Second coder code', required: false, aliases: ['second_coder_code', 'coder_2_code', 'second_code', '第二编码者编码'] },
  { key: 'second_coder_rationale', label: 'Second coder rationale', required: false, aliases: ['second_coder_rationale', 'coder_2_rationale', 'second_rationale', '第二编码者理由'] },
]

export function fieldsForImport(kind: SpreadsheetImportKind): ImportField[] {
  return kind === 'codebook' ? CODEBOOK_IMPORT_FIELDS : EXCERPT_IMPORT_FIELDS
}

function cellText(value: CellValue | null): string {
  if (value == null) return ''
  if (value instanceof globalThis.Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

export async function readExcelWorkbook(file: File): Promise<WorkbookSheet[]> {
  const sheets = await readWorkbook(file)
  return sheets.map(({ sheet, data }) => ({
    name: sheet,
    rows: data.map((row) => row.map(cellText)),
  }))
}

export function normalizeHeader(value: string): string {
  return normalizeImportHeader(value)
}

export function guessColumnMapping(headers: string[], fields: ImportField[], profile?: ImportProfile): ColumnMapping {
  const mapping: ColumnMapping = {}
  const usedColumns = new Set<number>()
  const normalizedHeaders = headers.map(normalizeHeader)

  fields.forEach((field) => {
    const profileAliases = profile?.fieldAliases[field.key] ?? []
    const aliases = new Set([field.key, ...profileAliases, ...field.aliases].map(normalizeHeader))
    const index = normalizedHeaders.findIndex((header, columnIndex) => !usedColumns.has(columnIndex) && aliases.has(header))
    mapping[field.key] = index >= 0 ? index : ''
    if (index >= 0) usedColumns.add(index)
  })

  return mapping
}

function columnLabel(index: number): string {
  let value = index + 1
  let label = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    value = Math.floor((value - 1) / 26)
  }
  return label
}

export function tableFromSheet(sheet: WorkbookSheet, headerRowIndex: number): ImportTable {
  const sourceRows = sheet.rows.slice(headerRowIndex)
  const width = Math.max(0, ...sourceRows.map((row) => row.length))
  const rawHeaders = sheet.rows[headerRowIndex] ?? []
  const headers = Array.from({ length: width }, (_, index) => rawHeaders[index]?.trim() || `Column ${columnLabel(index)}`)
  const rows = sheet.rows
    .slice(headerRowIndex + 1)
    .map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ''))
    .filter((row) => row.some((cell) => cell.trim().length > 0))

  return { headers, rows }
}

export function suggestHeaderRow(sheet: WorkbookSheet, fields: ImportField[]): number {
  const candidates = sheet.rows.slice(0, 10)
  let bestIndex = candidates.findIndex((row) => row.some((cell) => cell.trim().length > 0))
  let bestScore = -1

  candidates.forEach((row, index) => {
    const mapping = guessColumnMapping(row, fields)
    const mappedFields = fields.filter((field) => mapping[field.key] !== '')
    const requiredMapped = mappedFields.filter((field) => field.required).length
    const score = requiredMapped * 10 + mappedFields.length
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return Math.max(bestIndex, 0)
}

export function mapImportRows(table: ImportTable, mapping: ColumnMapping, fields: ImportField[]): MappedImportRow[] {
  return table.rows
    .map((row) => Object.fromEntries(fields.map((field) => {
      const columnIndex = mapping[field.key]
      return [field.key, columnIndex === '' || columnIndex == null ? '' : row[columnIndex] ?? '']
    })))
    .filter((row) => Object.values(row).some((value) => value.trim().length > 0))
}

export function missingRequiredMappings(mapping: ColumnMapping, fields: ImportField[]): ImportField[] {
  return fields.filter((field) => field.required && mapping[field.key] === '')
}
