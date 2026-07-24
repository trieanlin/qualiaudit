/// <reference types="node" />

import { readFile } from 'node:fs/promises'
import readWorkbook from 'read-excel-file/node'
import { describe, expect, it } from 'vitest'
import {
  CODEBOOK_IMPORT_FIELDS,
  EXCERPT_IMPORT_FIELDS,
  guessColumnMapping,
  mapImportRows,
  missingRequiredMappings,
  suggestHeaderRow,
  tableFromSheet,
  type WorkbookSheet,
} from './spreadsheet'

describe('Excel import mapping', () => {
  it('keeps the downloadable synthetic workbook aligned with the demo fixtures', async () => {
    const workbook = await readFile('public/samples/synthetic-qualiaudit-import.xlsx')
    const sheets = await readWorkbook(workbook)

    expect(sheets.map(({ sheet, data }) => ({ name: sheet, dataRows: data.length - 1 }))).toEqual([
      { name: 'Codebook', dataRows: 5 },
      { name: 'Human-coded excerpts', dataRows: 8 },
    ])
  })

  it('finds a header row below an export title and maps common excerpt aliases', () => {
    const sheet: WorkbookSheet = {
      name: 'Coded excerpts',
      rows: [
        ['Exported coding report'],
        [],
        ['Segment ID', 'Document', 'Quotation', 'Code', 'Confidence'],
        ['SYN-101', 'fictional-source', 'A synthetic excerpt.', 'ROUTINE_FIT', 'high'],
      ],
    }

    const headerRow = suggestHeaderRow(sheet, EXCERPT_IMPORT_FIELDS)
    const table = tableFromSheet(sheet, headerRow)
    const mapping = guessColumnMapping(table.headers, EXCERPT_IMPORT_FIELDS)

    expect(headerRow).toBe(2)
    expect(mapping).toMatchObject({
      excerpt_id: 0,
      source_id: 1,
      excerpt: 2,
      human_code: 3,
      human_confidence: 4,
    })
    expect(missingRequiredMappings(mapping, EXCERPT_IMPORT_FIELDS)).toEqual([])
  })

  it('preserves optional unmapped fields while building import records', () => {
    const table = {
      headers: ['Code', 'Definition'],
      rows: [
        ['ROUTINE_FIT', 'How monitoring fits daily life.'],
        ['', ''],
      ],
    }
    const mapping = guessColumnMapping(table.headers, CODEBOOK_IMPORT_FIELDS)
    const records = mapImportRows(table, mapping, CODEBOOK_IMPORT_FIELDS)

    expect(records).toEqual([{
      code: 'ROUTINE_FIT',
      definition: 'How monitoring fits daily life.',
      include_when: '',
      exclude_when: '',
      example: '',
    }])
  })

  it('supports Chinese column labels without changing the canonical data fields', () => {
    const mapping = guessColumnMapping(['代码', '定义', '纳入标准', '排除标准'], CODEBOOK_IMPORT_FIELDS)

    expect(mapping).toMatchObject({
      code: 0,
      definition: 1,
      include_when: 2,
      exclude_when: 3,
    })
  })

  it('reports required fields that still need a human mapping decision', () => {
    const mapping = guessColumnMapping(['Notes', 'Memo'], EXCERPT_IMPORT_FIELDS)
    expect(missingRequiredMappings(mapping, EXCERPT_IMPORT_FIELDS).map((field) => field.key)).toEqual([
      'excerpt_id',
      'source_id',
      'excerpt',
      'human_code',
    ])
  })
})
