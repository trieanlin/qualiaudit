function escapeCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export type SupportedDelimiter = ',' | ';' | '\t'

export interface DelimitedTextResult {
  rows: Record<string, string>[]
  headers: string[]
  delimiter: SupportedDelimiter
  delimiterLabel: 'comma' | 'semicolon' | 'tab'
}

export class DelimitedTextError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DelimitedTextError'
  }
}

export const MAX_DELIMITED_DATA_ROWS = 5000

export function toCsv<T extends object>(rows: T[], headers: (keyof T)[]): string {
  const lines = [headers.map(String).join(',')]
  rows.forEach((row) => lines.push(headers.map((header) => escapeCell(row[header])).join(',')))
  return `${lines.join('\n')}\n`
}

function parseRows(text: string, delimiter: SupportedDelimiter): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const next = text[index + 1]
    if (character === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === delimiter && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1
      row.push(cell)
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  if (quoted) {
    throw new DelimitedTextError('A quoted field is not closed. Check the final rows of the file.')
  }

  row.push(cell)
  if (row.some((value) => value.length > 0)) rows.push(row)
  return rows
}

function delimiterScore(rows: string[][]): number {
  const [header = [], ...values] = rows
  if (header.length <= 1) return 0
  const sample = values.slice(0, 25)
  const consistent = sample.filter((row) => row.length === header.length).length
  const inconsistent = sample.length - consistent
  return header.length * 5 + consistent * 10 - inconsistent * 8
}

function detectDelimiter(text: string): SupportedDelimiter {
  const candidates: SupportedDelimiter[] = [',', ';', '\t']
  const ranked = candidates
    .map((delimiter) => ({ delimiter, score: delimiterScore(parseRows(text, delimiter)) }))
    .sort((left, right) => right.score - left.score)

  if (!ranked[0] || ranked[0].score <= 0) {
    throw new DelimitedTextError('Could not detect a comma, semicolon, or tab-delimited table.')
  }
  return ranked[0].delimiter
}

function normalizeHeader(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en')
}

export function parseDelimitedText(source: string): DelimitedTextResult {
  const text = source.replace(/^\uFEFF/, '')
  if (text.trim().length === 0) throw new DelimitedTextError('The selected file is empty.')

  const delimiter = detectDelimiter(text)
  const parsed = parseRows(text, delimiter)
  const [rawHeaders = [], ...values] = parsed
  const headers = rawHeaders.map((header) => header.trim())

  if (headers.some((header) => header.length === 0)) {
    throw new DelimitedTextError('The header row contains an unnamed column.')
  }

  const seenHeaders = new Set<string>()
  headers.forEach((header) => {
    const normalized = normalizeHeader(header)
    if (seenHeaders.has(normalized)) {
      throw new DelimitedTextError(`The header “${header}” appears more than once.`)
    }
    seenHeaders.add(normalized)
  })

  if (values.length === 0) {
    throw new DelimitedTextError('The file has a header row but no data rows.')
  }
  if (values.length > MAX_DELIMITED_DATA_ROWS) {
    throw new DelimitedTextError(`Delimited-text imports are limited to ${MAX_DELIMITED_DATA_ROWS.toLocaleString('en')} data rows.`)
  }

  const inconsistentIndex = values.findIndex((cells) => cells.length !== headers.length)
  if (inconsistentIndex >= 0) {
    const actual = values[inconsistentIndex].length
    throw new DelimitedTextError(
      `Row ${inconsistentIndex + 2} has ${actual} columns; the header defines ${headers.length}.`,
    )
  }

  const rows = values.map((cells) => Object.fromEntries(
    headers.map((header, index) => [header, cells[index]?.trim() ?? '']),
  ))

  return {
    rows,
    headers,
    delimiter,
    delimiterLabel: delimiter === ',' ? 'comma' : delimiter === ';' ? 'semicolon' : 'tab',
  }
}

export function parseCsv(text: string): Record<string, string>[] {
  return parseDelimitedText(text).rows
}
