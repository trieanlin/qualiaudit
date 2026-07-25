/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DelimitedTextError, MAX_DELIMITED_DATA_ROWS, parseDelimitedText } from './csv'

const fixture = (name: string) => readFileSync(`test-fixtures/import/${name}`, 'utf8')

describe('delimited text import', () => {
  it('detects semicolon-delimited Unicode data and strips a UTF-8 BOM', () => {
    const result = parseDelimitedText(`\uFEFF${fixture('semicolon-unicode-codebook.csv')}`)

    expect(result.delimiterLabel).toBe('semicolon')
    expect(result.headers).toEqual(['code', 'definition', 'include_when', 'exclude_when', 'example'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].definition).toContain('café')
    expect(result.rows[0].example).toContain('茶壶')
  })

  it('detects tab-delimited records without splitting commas inside text', () => {
    const result = parseDelimitedText(fixture('tab-coded-excerpts.tsv'))

    expect(result.delimiterLabel).toBe('tab')
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].excerpt).toContain('kettle, so')
    expect(result.rows[1].excerpt).toContain('完全虚构')
  })

  it('preserves escaped quotes and newlines inside quoted comma-delimited cells', () => {
    const result = parseDelimitedText('id,text\nSYN-1,"A ""fictional"" line\nwith context."\n')

    expect(result.delimiterLabel).toBe('comma')
    expect(result.rows).toEqual([{ id: 'SYN-1', text: 'A "fictional" line\nwith context.' }])
  })

  it('rejects inconsistent row widths before replacing application state', () => {
    expect(() => parseDelimitedText(fixture('malformed-row-width.csv'))).toThrowError(
      new DelimitedTextError('Row 2 has 3 columns; the header defines 4.'),
    )
  })

  it('rejects duplicate Unicode-normalized headers and unclosed quotes', () => {
    expect(() => parseDelimitedText('code,ｃｏｄｅ\nA,B\n')).toThrow(/appears more than once/)
    expect(() => parseDelimitedText('code,definition\nA,"Not closed\n')).toThrow(/not closed/)
  })

  it('applies a predictable row limit to browser text imports', () => {
    const rows = Array.from({ length: MAX_DELIMITED_DATA_ROWS + 1 }, (_, index) => `${index},Synthetic`).join('\n')
    expect(() => parseDelimitedText(`id,text\n${rows}`)).toThrow(/5,000 data rows/)
  })
})
