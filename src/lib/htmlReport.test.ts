import { describe, expect, it } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import type { CodebookChange, ReflexiveMemo, Resolution } from '../types'
import {
  buildAuditMethodStatement,
  buildHtmlAuditReport,
  htmlAuditReportFilename,
} from './htmlReport'
import { buildBlindReviewPayload, runMockBlindReview } from './reviewer'

describe('printable HTML audit report', () => {
  const reviews = runMockBlindReview(buildBlindReviewPayload(
    SAMPLE_PROJECT,
    SAMPLE_CODEBOOK,
    SAMPLE_EXCERPTS,
  ))
  const resolution: Resolution = {
    excerpt_id: 'SYN-002',
    decision: 'unresolved',
    rationale: 'Both readings remain analytically useful.',
    final_code: 'FAMILY_FEEDBACK + PRIVACY_BOUNDARY',
    decided_at: '2026-07-22T11:00:00.000Z',
    changed_after_ai_exposure: false,
  }
  const before = SAMPLE_CODEBOOK.find((item) => item.code === 'FAMILY_FEEDBACK')
  if (!before) throw new Error('Missing sample code')
  const change: CodebookChange = {
    ledger_version: 'qualiaudit-codebook-change-v0.1',
    id: 'change-family-feedback',
    trigger_excerpt_id: 'SYN-002',
    code: 'FAMILY_FEEDBACK',
    before: { ...before },
    after: {
      ...before,
      definition: 'How welcomed, negotiated, or unwanted family feedback shapes engagement.',
    },
    author: 'Researcher',
    rationale: 'The boundary needs clearer guidance.',
    created_at: '2026-07-22T11:00:00.000Z',
    affected_excerpt_ids: ['SYN-002', 'SYN-007'],
    unresolved_recode_excerpt_ids: ['SYN-002', 'SYN-007'],
  }
  const memo: ReflexiveMemo = {
    memo_version: 'qualiaudit-reflexive-memo-v0.1',
    id: 'memo-syn-002',
    excerpt_id: 'SYN-002',
    resolution_decided_at: resolution.decided_at,
    decision: resolution.decision,
    author: 'Researcher',
    body: 'The alternative reading made privacy and family care feel analytically inseparable.',
    created_at: '2026-07-22T11:05:00.000Z',
  }
  const input = {
    project: SAMPLE_PROJECT,
    codebook: SAMPLE_CODEBOOK,
    excerpts: SAMPLE_EXCERPTS,
    frozen: {
      frozenAt: '2026-07-22T09:30:00.000Z',
      project: SAMPLE_PROJECT,
      codebook: SAMPLE_CODEBOOK,
      humanCoding: SAMPLE_EXCERPTS,
    },
    reviews,
    resolutions: [resolution],
    reflexiveMemos: [memo],
    codebookChanges: [change],
  }

  it('builds a self-contained, privacy-minimised report by default', () => {
    const report = buildHtmlAuditReport(input, {
      includeSourceText: false,
      exportedAt: '2026-07-22T12:00:00.000Z',
    })

    expect(report).toContain('<!doctype html>')
    expect(report).toContain('Content-Security-Policy')
    expect(report).toContain("default-src 'none'")
    expect(report).not.toContain('<script')
    expect(report).not.toContain('src="http')
    expect(report).not.toContain('href="http')
    expect(report).toContain('Source excerpts, context, and AI evidence quotes are omitted')
    expect(report).toContain('Omitted from this privacy-minimised report.')
    expect(report).not.toContain(SAMPLE_EXCERPTS[0].excerpt)
    expect(report).not.toContain(reviews[0].evidence_quote)
    expect(report).toContain('Both readings remain analytically useful.')
    expect(report).toContain('Researcher reflections linked to decisions')
    expect(report).toContain(memo.body)
    expect(report).toContain('QualiAudit HTML v0.2')
    expect(report).toContain('Second-coder rationale:')
    expect(report).toContain('Possible codebook issue:')
    expect(report).toContain('No post-exposure decision recorded.')
    expect(report).toContain('revisit after proposed FAMILY_FEEDBACK guidance change')
  })

  it('includes source evidence only after an explicit full-report choice', () => {
    const report = buildHtmlAuditReport(input, {
      includeSourceText: true,
      exportedAt: '2026-07-22T12:00:00.000Z',
    })

    expect(report).toContain(SAMPLE_EXCERPTS[0].excerpt)
    expect(report).toContain(reviews[0].evidence_quote)
    expect(report).toContain('This report contains source excerpts and evidence quotes')
    expect(report).toContain('@media print')
    expect(report).toContain('@page')
  })

  it('escapes imported research text instead of turning it into executable markup', () => {
    const unsafeProject = {
      ...SAMPLE_PROJECT,
      name: '<img src=x onerror=alert(1)>',
      researchQuestion: '<script>alert("research")</script>',
    }
    const unsafeExcerpts = [{
      ...SAMPLE_EXCERPTS[0],
      excerpt: '<script>alert("excerpt")</script>',
    }]
    const report = buildHtmlAuditReport({
      ...input,
      project: unsafeProject,
      excerpts: unsafeExcerpts,
      frozen: {
        ...input.frozen,
        project: unsafeProject,
        humanCoding: unsafeExcerpts,
      },
      reviews: [],
      resolutions: [],
      reflexiveMemos: [],
      codebookChanges: [],
    }, {
      includeSourceText: true,
      exportedAt: '2026-07-22T12:00:00.000Z',
    })

    expect(report).not.toContain('<script>alert')
    expect(report).not.toContain('<img src=x')
    expect(report).toContain('&lt;script&gt;alert(&quot;excerpt&quot;)&lt;/script&gt;')
    expect(report).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('records remote-review provenance without exposing provider credentials', () => {
    const remoteReview = {
      ...reviews[0],
      reviewer: 'openai-responses-v0.2' as const,
      provider: 'openai' as const,
      model: 'deployment-model',
      prompt_version: 'blind-review-v0.2',
      schema_version: 'blind-review-schema-v0.2',
      data_destination: 'openai-api' as const,
      consent_version: 'qualiaudit-openai-consent-v0.2' as const,
      request_id: 'qa-client-request',
      provider_request_id: 'provider-request',
      provider_response_id: 'resp_example',
    }
    const report = buildHtmlAuditReport({
      ...input,
      reviews: [remoteReview],
    }, {
      includeSourceText: false,
      exportedAt: '2026-07-22T12:00:00.000Z',
    })

    expect(report).toContain('deployment-model via OpenAI API')
    expect(report).toContain('qualiaudit-openai-consent-v0.2')
    expect(report).toContain('provider-request')
    expect(report).toContain('store=false')
    expect(report).not.toContain('OPENAI_API_KEY')
  })

  it('uses method-aware language and a filesystem-safe filename', () => {
    expect(buildAuditMethodStatement(
      { ...SAMPLE_PROJECT, analysisMode: 'reflexive' },
      SAMPLE_EXCERPTS.length,
      reviews[0],
    )).toContain('prompt for reflexivity rather than an error')
    expect(htmlAuditReportFilename({
      ...SAMPLE_PROJECT,
      name: ' Sleep / Home: “Pilot” ',
    })).toBe('qualiaudit-sleep-home-pilot-audit.html')
  })
})
