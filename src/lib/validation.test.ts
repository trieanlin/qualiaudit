import { describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS } from '../data/sample'
import { validateCodebook, validateExcerpts } from './validation'

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

  it('rejects human codes that are absent from the codebook', () => {
    const issues = validateExcerpts([{ ...SAMPLE_EXCERPTS[0], human_code: 'INVENTED_CODE' }], SAMPLE_CODEBOOK)
    expect(issues[0]).toMatchObject({ level: 'error', field: 'human_code' })
  })
})
