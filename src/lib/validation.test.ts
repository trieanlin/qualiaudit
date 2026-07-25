/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS } from '../data/sample'
import type { HumanCodedExcerpt } from '../types'
import { parseDelimitedText } from './csv'
import { validateCodebook, validateExcerpts } from './validation'

const fixtureRows = (name: string) => parseDelimitedText(
  readFileSync(`test-fixtures/import/${name}`, 'utf8'),
).rows as unknown as HumanCodedExcerpt[]

describe('material validation', () => {
  it('accepts the bundled synthetic fixtures', () => {
    expect(validateCodebook(SAMPLE_CODEBOOK)).toEqual([])
    expect(validateExcerpts(SAMPLE_EXCERPTS, SAMPLE_CODEBOOK)).toEqual([])
  })

  it('reports duplicate and incomplete code definitions as explicit rule checks', () => {
    const issues = validateCodebook([
      SAMPLE_CODEBOOK[0],
      { ...SAMPLE_CODEBOOK[0], definition: '', include_when: '', code: SAMPLE_CODEBOOK[0].code.toLowerCase() },
    ])

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: 'error', field: 'definition' }),
      expect.objectContaining({ level: 'warning', field: 'include_when' }),
      expect.objectContaining({ level: 'error', field: 'code', message: expect.stringContaining('Duplicate') }),
    ]))
  })

  it('detects visually equivalent Unicode code identifiers as duplicates', () => {
    const issues = validateCodebook([
      SAMPLE_CODEBOOK[0],
      { ...SAMPLE_CODEBOOK[0], code: 'ＲＯＵＴＩＮＥ＿ＦＩＴ' },
    ])

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: 'error', field: 'code', message: expect.stringContaining('Duplicate') }),
    ]))
  })

  it('rejects human codes that are absent from the codebook', () => {
    const issues = validateExcerpts([{ ...SAMPLE_EXCERPTS[0], human_code: 'INVENTED_CODE' }], SAMPLE_CODEBOOK)
    expect(issues[0]).toMatchObject({ level: 'error', field: 'human_code' })
  })

  it('makes a multi-code primary cell an explicit blocking issue', () => {
    const issues = validateExcerpts(fixtureRows('multi-code-excerpts.csv'), SAMPLE_CODEBOOK)

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'error',
        field: 'human_code',
        message: expect.stringContaining('Multiple human codes detected'),
      }),
    ]))
  })

  it('checks optional second-coder codes against the same codebook', () => {
    const issues = validateExcerpts([
      { ...SAMPLE_EXCERPTS[0], second_coder_code: 'NOT_A_CODE' },
    ], SAMPLE_CODEBOOK)

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: 'error', field: 'second_coder_code' }),
    ]))
  })

  it('flags overlapping excerpts from one source as a segment-boundary question', () => {
    const issues = validateExcerpts(fixtureRows('segment-boundary-excerpts.csv'), SAMPLE_CODEBOOK)

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'warning',
        field: 'excerpt',
        message: expect.stringContaining('segment boundaries'),
      }),
    ]))
  })
})
