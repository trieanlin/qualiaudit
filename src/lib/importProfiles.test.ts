import { describe, expect, it } from 'vitest'
import {
  detectImportProfile,
  getImportProfile,
} from './importProfiles'
import {
  CODEBOOK_IMPORT_FIELDS,
  EXCERPT_IMPORT_FIELDS,
  guessColumnMapping,
  missingRequiredMappings,
} from './spreadsheet'

describe('research-tool import profiles', () => {
  it('detects and maps an ATLAS.ti quotation report without hiding the source columns', () => {
    const headers = ['ID', 'Document', 'Quotation Content', 'Quotation Comment', 'Codes', 'Reference']
    const profile = detectImportProfile(headers, 'excerpts')
    const mapping = guessColumnMapping(headers, EXCERPT_IMPORT_FIELDS, profile ?? undefined)

    expect(profile?.id).toBe('atlasti-quotation-report')
    expect(mapping).toMatchObject({
      excerpt_id: 0,
      source_id: 1,
      excerpt: 2,
      human_rationale: 3,
      human_code: 4,
      context: 5,
    })
    expect(missingRequiredMappings(mapping, EXCERPT_IMPORT_FIELDS)).toEqual([])
  })

  it('detects MAXQDA retrieved segments but leaves a missing segment ID unresolved', () => {
    const headers = ['Document name', 'Coded segment', 'Code', 'Comment', 'Position']
    const profile = detectImportProfile(headers, 'excerpts')
    const mapping = guessColumnMapping(headers, EXCERPT_IMPORT_FIELDS, profile ?? undefined)

    expect(profile?.id).toBe('maxqda-retrieved-segments')
    expect(mapping).toMatchObject({
      excerpt_id: '',
      source_id: 0,
      excerpt: 1,
      human_code: 2,
      human_rationale: 3,
      context: 4,
    })
    expect(missingRequiredMappings(mapping, EXCERPT_IMPORT_FIELDS).map((field) => field.key)).toEqual(['excerpt_id'])
  })

  it('detects an NVivo codebook only when supporting report columns are present', () => {
    const headers = ['Name', 'Description', 'Files', 'References']
    const profile = detectImportProfile(headers, 'codebook')
    const mapping = guessColumnMapping(headers, CODEBOOK_IMPORT_FIELDS, profile ?? undefined)

    expect(profile?.id).toBe('nvivo-codebook')
    expect(mapping).toMatchObject({ code: 0, definition: 1 })
  })

  it('does not label a generic QualiAudit table as a vendor export', () => {
    expect(detectImportProfile(
      ['excerpt_id', 'source_id', 'excerpt', 'human_code'],
      'excerpts',
    )).toBeNull()
  })

  it('allows a researcher to apply a profile explicitly while keeping required fields visible', () => {
    const profile = getImportProfile('nvivo-coding-report')
    const headers = ['Reference number', 'Source name', 'Coded text', 'Node name']
    const mapping = guessColumnMapping(headers, EXCERPT_IMPORT_FIELDS, profile)

    expect(mapping).toMatchObject({
      excerpt_id: 0,
      source_id: 1,
      excerpt: 2,
      human_code: 3,
    })
    expect(missingRequiredMappings(mapping, EXCERPT_IMPORT_FIELDS)).toEqual([])
  })
})

