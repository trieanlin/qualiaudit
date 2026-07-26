import type {
  AiReview,
  CodebookChange,
  CodeDefinition,
  FrozenSnapshot,
  HumanCodedExcerpt,
  ProjectBrief,
  ReflexiveMemo,
  Resolution,
} from '../types'
import { categoryLabel, classifyCase } from './queue'
import { decisionLabels } from './resolutions'
import {
  buildSecondCoderComparisons,
  secondCoderRelationshipLabel,
  summariseSecondCoderComparisons,
} from './secondCoder'

export interface HtmlAuditReportOptions {
  includeSourceText: boolean
  exportedAt?: string
}

export interface HtmlAuditReportInput {
  project: ProjectBrief
  codebook: CodeDefinition[]
  excerpts: HumanCodedExcerpt[]
  frozen: FrozenSnapshot
  reviews: AiReview[]
  resolutions: Resolution[]
  reflexiveMemos: ReflexiveMemo[]
  codebookChanges: CodebookChange[]
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ENTITIES[character])
}

function text(value: unknown, fallback = 'Not recorded'): string {
  const rendered = String(value ?? '').trim()
  return escapeHtml(rendered || fallback)
}

function prose(value: unknown, fallback = 'Not recorded'): string {
  return text(value, fallback).replace(/\r?\n/g, '<br>')
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not recorded'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return text(value)
  return `${new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(parsed)} UTC`
}

function renderDefinitionGuidance(definition: CodeDefinition): string {
  return `
    <p>${prose(definition.definition)}</p>
    <dl class="guidance">
      <div><dt>Include when</dt><dd>${prose(definition.include_when)}</dd></div>
      <div><dt>Exclude when</dt><dd>${prose(definition.exclude_when)}</dd></div>
      ${definition.example ? `<div><dt>Example</dt><dd>${prose(definition.example)}</dd></div>` : ''}
    </dl>
  `
}

function renderSourceText(value: string | undefined, includeSourceText: boolean): string {
  return includeSourceText
    ? prose(value, 'Not supplied')
    : '<span class="omitted">Omitted from this privacy-minimised report.</span>'
}

function renderEmptyOrList(items: string[], emptyMessage: string): string {
  return items.length > 0
    ? `<ul>${items.join('')}</ul>`
    : `<p class="empty">${escapeHtml(emptyMessage)}</p>`
}

function reportFilenamePart(value: string): string {
  const normalised = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return normalised || 'project'
}

export function htmlAuditReportFilename(project: ProjectBrief): string {
  return `qualiaudit-${reportFilenamePart(project.name)}-audit.html`
}

export function buildAuditMethodStatement(
  project: ProjectBrief,
  excerptCount: number,
  reviewer?: AiReview,
  secondCoderCount = 0,
): string {
  const usedOpenAi = reviewer?.provider === 'openai'
  const reviewerDescription = usedOpenAi
    ? `the ${reviewer?.model ?? 'configured OpenAI'} reviewer`
    : 'the deterministic local mock reviewer'
  const base = project.analysisMode === 'reflexive'
    ? `We used QualiAudit to support reflexive engagement with an independently generated AI reading of ${excerptCount} coded excerpts. Human first-pass interpretations were frozen before review and withheld from ${reviewerDescription}. Divergence was treated as a prompt for reflexivity rather than an error or accuracy measure. Queue triage organised attention without batch resolution, automatic recoding, or hiding unresolved cases. Researchers retained final interpretive authority and documented post-exposure decisions and researcher-authored memos in an audit log.`
    : `We used QualiAudit to compare human first-pass coding with an independently generated AI reading of ${excerptCount} coded excerpts. Human codes and rationales were frozen and withheld from ${reviewerDescription}. Descriptive overlap and divergence were used to prioritise human review, not as validation or intercoder reliability. Queue triage organised attention without batch resolution, automatic recoding, or hiding unresolved cases. Researchers retained final decision authority and documented post-exposure decisions and researcher-authored memos in an audit log.`
  if (secondCoderCount === 0) return base
  const secondHumanSentence = project.analysisMode === 'reflexive'
    ? ` Optional second-human readings were available for ${secondCoderCount} excerpts and were documented separately as interpretive overlap or alternative readings; they were not sent to the AI reviewer.`
    : ` Optional second-human coding was available for ${secondCoderCount} excerpts and was reported separately from human–AI comparison; no reliability coefficient was inferred from this subset.`
  return `${base}${secondHumanSentence}`
}

export function buildHtmlAuditReport(
  input: HtmlAuditReportInput,
  options: HtmlAuditReportOptions,
): string {
  const {
    project,
    codebook,
    excerpts,
    frozen,
    reviews,
    resolutions,
    reflexiveMemos,
    codebookChanges,
  } = input
  const exportedAt = options.exportedAt ?? new Date().toISOString()
  const reviewer = reviews[0]
  const usedOpenAi = reviewer?.provider === 'openai'
  const reviewerLabel = usedOpenAi
    ? `${reviewer.model ?? 'configured model'} via OpenAI API`
    : reviewer?.model ?? reviewer?.reviewer ?? 'Not run'
  const secondCoderComparisons = buildSecondCoderComparisons(excerpts)
  const secondCoderSummary = summariseSecondCoderComparisons(secondCoderComparisons)
  const methodStatement = buildAuditMethodStatement(project, excerpts.length, reviewer, secondCoderSummary.total)
  const resolutionByExcerpt = new Map(resolutions.map((resolution) => [resolution.excerpt_id, resolution]))
  const reviewByExcerpt = new Map(reviews.map((review) => [review.excerpt_id, review]))
  const memosByExcerpt = new Map<string, ReflexiveMemo[]>()
  for (const memo of reflexiveMemos) {
    memosByExcerpt.set(memo.excerpt_id, [...(memosByExcerpt.get(memo.excerpt_id) ?? []), memo])
  }
  const pendingExcerpts = excerpts.filter((excerpt) => !resolutionByExcerpt.has(excerpt.excerpt_id))
  const intentionallyUnresolved = resolutions.filter((resolution) => resolution.decision === 'unresolved')
  const changedAfterExposure = resolutions.filter((resolution) => resolution.changed_after_ai_exposure)
  const unresolvedRecoding = codebookChanges.flatMap((change) => (
    change.unresolved_recode_excerpt_ids.map((excerptId) => ({
      change,
      excerptId,
    }))
  ))

  const provenanceRows = [
    ['Human interpretation frozen', formatDate(frozen.frozenAt)],
    ['Reviewer', text(reviewerLabel)],
    ['Provider', text(usedOpenAi ? 'OpenAI API via QualiAudit server endpoint' : 'Local browser only')],
    ['Model / adapter', text(reviewer?.model ?? reviewer?.reviewer ?? 'Not run')],
    ['Prompt / rules version', text(reviewer?.prompt_version ?? (usedOpenAi ? 'Not recorded' : 'mock-rules-v0.1'))],
    ['Output schema version', text(reviewer?.schema_version ?? (usedOpenAi ? 'Not recorded' : 'mock-review-output-v0.1'))],
    ['Independent review run', formatDate(reviewer?.reviewed_at)],
    ['Data destination', text(usedOpenAi ? 'OpenAI API via server endpoint' : 'Local browser only')],
    ...(usedOpenAi
      ? [
          ['Transmission consent', text(reviewer?.consent_version)],
          ['Client request ID', text(reviewer?.request_id)],
          ['Provider request ID', text(reviewer?.provider_request_id)],
          ['Provider response ID', text(reviewer?.provider_response_id)],
          ['Provider storage request', 'store=false'],
        ]
      : []),
  ]

  const codebookHtml = codebook.map((definition) => `
    <article class="definition">
      <h3>${text(definition.code)}</h3>
      ${renderDefinitionGuidance(definition)}
    </article>
  `).join('')

  const codebookChangesHtml = codebookChanges.map((change) => `
    <article class="ledger-event">
      <div class="item-topline">
        <span class="pill">${text(change.code)}</span>
        <time datetime="${escapeHtml(change.created_at)}">${formatDate(change.created_at)}</time>
      </div>
      <h3>Proposed by ${text(change.author)}</h3>
      <p><strong>Rationale.</strong> ${prose(change.rationale)}</p>
      <div class="before-after">
        <section>
          <h4>Frozen before</h4>
          ${renderDefinitionGuidance(change.before)}
        </section>
        <section>
          <h4>Proposed after</h4>
          ${renderDefinitionGuidance(change.after)}
        </section>
      </div>
      <dl class="compact-list">
        <div><dt>Affected excerpts</dt><dd>${text(change.affected_excerpt_ids.join(', '), 'None')}</dd></div>
        <div><dt>Unresolved recoding</dt><dd>${text(change.unresolved_recode_excerpt_ids.join(', '), 'None')}</dd></div>
        <div><dt>Trigger excerpt</dt><dd>${text(change.trigger_excerpt_id)}</dd></div>
      </dl>
    </article>
  `).join('')

  const decisionLogHtml = resolutions.map((resolution) => {
    const human = excerpts.find((excerpt) => excerpt.excerpt_id === resolution.excerpt_id)
    const ai = reviewByExcerpt.get(resolution.excerpt_id)
    if (!human) return ''
    return `
      <article class="decision">
        <div class="item-topline">
          <span class="pill">${text(decisionLabels[resolution.decision])}</span>
          <time datetime="${escapeHtml(resolution.decided_at)}">${formatDate(resolution.decided_at)}</time>
        </div>
        <h3>${text(resolution.excerpt_id)} · ${text(human.source_id)}</h3>
        <p>${prose(resolution.rationale)}</p>
        <dl class="compact-list">
          <div><dt>Human first-pass</dt><dd>${text(human.human_code)}</dd></div>
          <div><dt>AI primary reading</dt><dd>${text(ai?.primary_suggested_code)}</dd></div>
          <div><dt>Final code</dt><dd>${text(resolution.final_code ?? human.human_code)}</dd></div>
          <div><dt>Changed after AI exposure</dt><dd>${resolution.changed_after_ai_exposure ? 'Yes' : 'No'}</dd></div>
        </dl>
      </article>
    `
  }).join('')

  const reflexiveMemosHtml = reflexiveMemos.map((memo) => `
    <article class="decision">
      <div class="item-topline">
        <span class="pill">${text(memo.excerpt_id)} · ${text(decisionLabels[memo.decision])}</span>
        <time datetime="${escapeHtml(memo.created_at)}">${formatDate(memo.created_at)}</time>
      </div>
      <h3>${text(memo.author)}</h3>
      <p>${prose(memo.body)}</p>
      <p class="meta">Linked decision recorded ${formatDate(memo.resolution_decided_at)}.</p>
    </article>
  `).join('')

  const secondCoderComparisonsHtml = secondCoderComparisons.map((comparison) => `
    <article class="decision second-human-record">
      <div class="item-topline">
        <span class="pill">${text(secondCoderRelationshipLabel(comparison.relationship, project.analysisMode))}</span>
        <span>${text(comparison.excerpt_id)} · ${text(comparison.source_id)}</span>
      </div>
      <dl class="compact-list">
        <div><dt>First human</dt><dd>${text(comparison.first_coder_code)}</dd></div>
        <div><dt>Second human</dt><dd>${text(comparison.second_coder_code)}</dd></div>
        <div><dt>Second-human rationale</dt><dd>${prose(comparison.second_coder_rationale, 'No rationale supplied.')}</dd></div>
      </dl>
    </article>
  `).join('')

  const pendingItems = pendingExcerpts.map((excerpt) => (
    `<li><strong>${text(excerpt.excerpt_id)}</strong> · no post-exposure decision recorded</li>`
  ))
  const unresolvedItems = intentionallyUnresolved.map((resolution) => (
    `<li><strong>${text(resolution.excerpt_id)}</strong> · intentionally unresolved: ${prose(resolution.rationale)}</li>`
  ))
  const recodingItems = unresolvedRecoding.map(({ change, excerptId }) => (
    `<li><strong>${text(excerptId)}</strong> · revisit after proposed ${text(change.code)} guidance change</li>`
  ))

  const caseAppendixHtml = excerpts.map((human) => {
    const ai = reviewByExcerpt.get(human.excerpt_id)
    const resolution = resolutionByExcerpt.get(human.excerpt_id)
    const caseMemos = memosByExcerpt.get(human.excerpt_id) ?? []
    const category = ai ? categoryLabel(classifyCase(human, ai, codebook), project.analysisMode) : 'Not reviewed'
    return `
      <article class="case">
        <div class="item-topline">
          <span class="pill">${text(category)}</span>
          <span>${text(human.excerpt_id)} · ${text(human.source_id)}</span>
        </div>
        <h3>Source excerpt</h3>
        <blockquote>${renderSourceText(human.excerpt, options.includeSourceText)}</blockquote>
        ${human.context ? `<p><strong>Context.</strong> ${renderSourceText(human.context, options.includeSourceText)}</p>` : ''}
        <div class="case-readings">
          <section>
            <h4>Frozen human first-pass</h4>
            <p class="code">${text(human.human_code)}</p>
            <p>${prose(human.human_rationale, 'No rationale supplied.')}</p>
            <p class="meta">Confidence: ${text(human.human_confidence, 'Not stated')}</p>
          </section>
          <section>
            <h4>Independent AI reading</h4>
            ${ai
              ? `
                <p class="code">${text(ai.primary_suggested_code)}</p>
                ${ai.alternative_code ? `<p class="meta">Alternative: ${text(ai.alternative_code)}</p>` : ''}
                <p>${prose(ai.rationale)}</p>
                <blockquote><strong>Evidence.</strong> ${renderSourceText(ai.evidence_quote, options.includeSourceText)}</blockquote>
                <p class="meta">Uncertainty: ${text(ai.uncertainty)} · More context: ${ai.needs_more_context ? 'requested' : 'not requested'}</p>
                ${ai.possible_codebook_issue ? `<p class="meta">Possible codebook issue: ${prose(ai.possible_codebook_issue)}</p>` : ''}
              `
            : '<p class="empty">No independent review recorded.</p>'}
          </section>
        </div>
        ${human.second_coder_code
          ? `
            <section class="case-second-human">
              <h4>Separate second-human record</h4>
              <p class="code">${text(human.second_coder_code)}</p>
              <p>${prose(human.second_coder_rationale, 'No second-human rationale supplied.')}</p>
              <p class="meta">${text(secondCoderRelationshipLabel(
                human.second_coder_code === human.human_code ? 'same_code' : 'different_code',
                project.analysisMode,
              ))}. Withheld from the AI reviewer and excluded from human–AI queue categories.</p>
            </section>
          `
          : ''}
        <section class="case-decision">
          <h4>Human resolution</h4>
          ${resolution
            ? `<p><strong>${text(decisionLabels[resolution.decision])}.</strong> ${prose(resolution.rationale)}</p>`
            : '<p class="empty">No post-exposure decision recorded.</p>'}
          ${caseMemos.length > 0
            ? `<h4>Reflexive memos</h4>${caseMemos.map((memo) => `<p><strong>${text(memo.author)}.</strong> ${prose(memo.body)}</p>`).join('')}`
            : ''}
        </section>
      </article>
    `
  }).join('')

  const privacyLabel = options.includeSourceText
    ? 'Full source excerpts, context, and AI evidence quotes are included.'
    : 'Source excerpts, context, and AI evidence quotes are omitted. Coding, decision rationales, and researcher-authored memos remain.'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
  <meta name="generator" content="QualiAudit">
  <title>${text(project.name)} · QualiAudit audit report</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #18363a;
      --muted: #607174;
      --line: #cbd3cf;
      --paper: #fbf8f1;
      --panel: #ffffff;
      --sage: #e8f0e9;
      --rose: #f3e6e1;
      --accent: #8e4d42;
    }
    * { box-sizing: border-box; }
    html { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--paper); }
    body { margin: 0; font-size: 10.5pt; line-height: 1.55; }
    main { width: min(1060px, calc(100% - 40px)); margin: 0 auto; padding: 36px 0 64px; }
    h1, h2, h3, h4 { font-family: Georgia, "Times New Roman", serif; line-height: 1.15; margin: 0; }
    h1 { max-width: 780px; font-size: clamp(30px, 6vw, 58px); font-weight: 500; }
    h2 { font-size: 26px; font-weight: 500; }
    h3 { font-size: 19px; }
    h4 { font-size: 14px; text-transform: uppercase; letter-spacing: .08em; }
    p { margin: 8px 0; }
    blockquote { margin: 12px 0; padding: 14px 18px; border-left: 3px solid var(--accent); background: var(--paper); }
    code { overflow-wrap: anywhere; }
    .report-header { padding: 34px; border: 1px solid var(--line); background: var(--panel); }
    .eyebrow { display: block; margin-bottom: 12px; font-size: 10px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--accent); }
    .lede { max-width: 720px; margin-top: 18px; font-family: Georgia, "Times New Roman", serif; font-size: 18px; color: var(--muted); }
    .header-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin-top: 28px; background: var(--line); border: 1px solid var(--line); }
    .metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; margin-top: 28px; background: var(--line); border: 1px solid var(--line); }
    .header-meta div, .metrics div { min-width: 0; padding: 14px; background: var(--panel); }
    .header-meta dt, .compact-list dt, .guidance dt { font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
    .header-meta dd, .compact-list dd, .guidance dd { margin: 4px 0 0; overflow-wrap: anywhere; }
    .privacy-notice { margin-top: 16px; padding: 12px 14px; border: 1px solid #b8c8bd; background: var(--sage); }
    .screen-note { margin: 16px 0 0; color: var(--muted); }
    .metrics { margin: 20px 0 0; }
    .metrics strong { display: block; font-family: Georgia, "Times New Roman", serif; font-size: 30px; font-weight: 500; }
    .metrics span { color: var(--muted); }
    .section { margin-top: 42px; }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
    .section-heading p { max-width: 520px; margin: 0; color: var(--muted); }
    .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .card, .definition, .ledger-event, .decision, .case { border: 1px solid var(--line); background: var(--panel); }
    .card { padding: 22px; }
    .provenance { display: grid; grid-template-columns: minmax(180px, .65fr) 1.35fr; margin: 0; }
    .provenance div { display: contents; }
    .provenance dt, .provenance dd { margin: 0; padding: 9px 0; border-bottom: 1px solid #e4e8e5; }
    .provenance dt { color: var(--muted); }
    .provenance dd { text-align: right; overflow-wrap: anywhere; }
    .safeguard { padding: 18px; border: 1px solid #b8c8bd; background: var(--sage); }
    .safeguard strong { display: block; }
    .definition-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
    .definition { padding: 18px; }
    .definition h3 { font-family: inherit; font-size: 13px; letter-spacing: .05em; }
    .guidance { margin: 12px 0 0; }
    .guidance div + div { margin-top: 9px; }
    .guidance dd { margin-left: 0; }
    .item-list { display: grid; gap: 12px; margin-top: 16px; }
    .ledger-event, .decision, .case { padding: 22px; break-inside: avoid; page-break-inside: avoid; }
    .item-topline { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; color: var(--muted); }
    .pill { display: inline-block; padding: 4px 8px; border-radius: 999px; background: var(--sage); color: var(--ink); font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
    .before-after, .case-readings { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; margin-top: 18px; border: 1px solid var(--line); background: var(--line); }
    .before-after section, .case-readings section { padding: 18px; background: var(--panel); }
    .before-after section + section { background: #f4f7f3; }
    .second-human-safeguard, .case-second-human { border-color: #b8c8bd; background: var(--sage); }
    .case-second-human { margin-top: 12px; padding: 18px; border: 1px solid #b8c8bd; }
    .compact-list { margin: 16px 0 0; }
    .compact-list div { display: grid; grid-template-columns: 180px 1fr; gap: 12px; padding: 7px 0; border-top: 1px solid #e4e8e5; }
    .compact-list dd { margin: 0; }
    .open-work { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
    .open-work article { padding: 18px; border: 1px solid var(--line); background: var(--panel); }
    .open-work ul { margin: 12px 0 0; padding-left: 18px; }
    .open-work li + li { margin-top: 8px; }
    .case h3 { margin-top: 6px; }
    .case .code { font-weight: 800; letter-spacing: .04em; }
    .case .meta, .empty { color: var(--muted); }
    .case-decision { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }
    .omitted { color: var(--muted); font-style: italic; }
    .limitations { border-color: #d7b9af; background: var(--rose); }
    .limitations ul { margin-bottom: 0; }
    footer { margin-top: 42px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); }
    @media (max-width: 760px) {
      main { width: min(100% - 24px, 1060px); padding-top: 12px; }
      .report-header { padding: 22px; }
      .header-meta, .metrics, .two-column, .definition-grid, .before-after, .case-readings, .open-work { grid-template-columns: 1fr; }
      .section-heading { display: block; }
      .section-heading p { margin-top: 8px; }
      .compact-list div { grid-template-columns: 1fr; }
      .provenance { grid-template-columns: 1fr; }
      .provenance div { display: block; padding: 9px 0; border-bottom: 1px solid #e4e8e5; }
      .provenance dt, .provenance dd { padding: 0; border: 0; text-align: left; }
    }
    @page { size: A4; margin: 15mm; }
    @media print {
      :root { --paper: #fff; --panel: #fff; }
      body { font-size: 9.5pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      main { width: 100%; padding: 0; }
      .screen-note { display: none; }
      .report-header { padding: 0 0 18px; border: 0; }
      h1 { font-size: 34pt; }
      h2 { font-size: 20pt; }
      .section { margin-top: 28px; }
      .section-heading, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
      .card, .definition, .ledger-event, .decision, .case, .open-work article { break-inside: avoid; page-break-inside: avoid; }
      p, li, blockquote { orphans: 3; widows: 3; }
    }
  </style>
</head>
<body>
  <main>
    <header class="report-header">
      <span class="eyebrow">QualiAudit · audit report</span>
      <h1>${text(project.name)}</h1>
      <p class="lede">A human-led record of independent review, interpretive divergence, and post-exposure decisions.</p>
      <dl class="header-meta">
        <div><dt>Analysis approach</dt><dd>${text(project.analysisMode === 'reflexive' ? 'Reflexive thematic analysis' : 'Codebook / framework analysis')}</dd></div>
        <div><dt>Project created</dt><dd>${formatDate(project.createdAt)}</dd></div>
        <div><dt>Report exported</dt><dd>${formatDate(exportedAt)}</dd></div>
        <div><dt>Report format</dt><dd>QualiAudit HTML v0.4</dd></div>
      </dl>
      <p class="privacy-notice"><strong>Source-text setting.</strong> ${escapeHtml(privacyLabel)}</p>
      <p class="screen-note">This file is self-contained and makes no network requests. Use your browser’s Print command to create a paper or PDF copy.</p>
      <div class="metrics">
        <div><strong>${excerpts.length}</strong><span>excerpts reviewed</span></div>
        <div><strong>${resolutions.length}</strong><span>human decisions recorded</span></div>
        <div><strong>${changedAfterExposure.length}</strong><span>changed after AI exposure</span></div>
        <div><strong>${reflexiveMemos.length}</strong><span>reflexive memos</span></div>
        <div><strong>${codebookChanges.length}</strong><span>codebook change events</span></div>
      </div>
    </header>

    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">Project and method</span><h2>Analytic frame</h2></div></div>
      <div class="two-column">
        <article class="card">
          <h3>Research question</h3>
          <p>${prose(project.researchQuestion)}</p>
          <h3>Intended role of AI</h3>
          <p>${prose(project.aiRole)}</p>
        </article>
        <article class="card">
          <h3>Draft AI-use methods statement</h3>
          <blockquote>${prose(methodStatement)}</blockquote>
          <p class="empty">Adapt this draft to the actual method, model, provider, governance, and institutional requirements.</p>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div><span class="eyebrow">Review provenance</span><h2>What happened, and when</h2></div>
        <p>Provider and request identifiers appear only when they were recorded by a consented remote review.</p>
      </div>
      <div class="two-column">
        <article class="card">
          <dl class="provenance">
            ${provenanceRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`).join('')}
          </dl>
        </article>
        <aside class="safeguard">
          <h3>Blind-review boundary</h3>
          <p>Human codes, rationales, confidence, second-coder decisions, final conclusions, and researcher-authored memos were withheld from the independent reviewer.</p>
          <p><strong>AI final-decision authority:</strong> none. Human researchers retained interpretive authority.</p>
          <p><strong>Queue triage:</strong> attention organisation only. It offered no batch resolution or automatic recoding, kept every unresolved case visible, and pinned context, confidence, boundary, ambiguity, and unsupported-reading concerns first.</p>
        </aside>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div><span class="eyebrow">Second-human comparison</span><h2>Human readings kept separate from AI review</h2></div>
        <p>${secondCoderSummary.total} optional record${secondCoderSummary.total === 1 ? '' : 's'}; excluded from human–AI queue categories.</p>
      </div>
      <article class="card second-human-safeguard">
        <p><strong>Analytical boundary.</strong> These records were frozen before AI exposure and withheld from the AI reviewer. ${project.analysisMode === 'codebook'
          ? 'Counts are descriptive only; no intercoder reliability coefficient is calculated from this optional subset.'
          : 'Alternative human readings are documented as interpretive resources rather than coding errors.'}</p>
        <dl class="compact-list">
          <div><dt>Total optional records</dt><dd>${secondCoderSummary.total}</dd></div>
          <div><dt>${project.analysisMode === 'reflexive' ? 'Interpretive overlap' : 'Direct code overlap'}</dt><dd>${secondCoderSummary.sameCode}</dd></div>
          <div><dt>${project.analysisMode === 'reflexive' ? 'Alternative readings' : 'Different interpretations'}</dt><dd>${secondCoderSummary.differentCode}</dd></div>
        </dl>
      </article>
      <div class="item-list">${secondCoderComparisonsHtml || '<p class="empty">No optional second-human records were supplied.</p>'}</div>
    </section>

    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">Codebook</span><h2>Frozen analytic guidance</h2></div><p>${codebook.length} definitions used during independent review.</p></div>
      <div class="definition-grid">${codebookHtml}</div>
    </section>

    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">Codebook change ledger</span><h2>Proposed revisions</h2></div><p>Events preserve frozen before/proposed after guidance without rewriting the first-pass snapshot.</p></div>
      <div class="item-list">
        ${codebookChangesHtml || '<p class="empty">No codebook changes recorded.</p>'}
      </div>
    </section>

    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">Open analytic work</span><h2>Cases requiring further human attention</h2></div></div>
      <div class="open-work">
        <article><h3>Pending resolution</h3>${renderEmptyOrList(pendingItems, 'No cases are awaiting a post-exposure decision.')}</article>
        <article><h3>Intentionally unresolved</h3>${renderEmptyOrList(unresolvedItems, 'No cases were intentionally left unresolved.')}</article>
        <article><h3>Unresolved recoding</h3>${renderEmptyOrList(recodingItems, 'No codebook-linked recoding work is recorded.')}</article>
      </div>
    </section>

    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">Decision log</span><h2>Post-exposure decisions</h2></div><p>${resolutions.length} of ${excerpts.length} cases have a recorded decision.</p></div>
      <div class="item-list">${decisionLogHtml || '<p class="empty">No post-exposure decisions recorded.</p>'}</div>
    </section>

    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">Reflexive memo log</span><h2>Researcher reflections linked to decisions</h2></div><p>${reflexiveMemos.length} append-only memo${reflexiveMemos.length === 1 ? '' : 's'} recorded.</p></div>
      <div class="item-list">${reflexiveMemosHtml || '<p class="empty">No reflexive memos recorded.</p>'}</div>
    </section>

    <section class="section">
      <div class="section-heading"><div><span class="eyebrow">Case appendix</span><h2>Excerpt-level comparison record</h2></div><p>Source text follows the privacy setting selected at export.</p></div>
      <div class="item-list">${caseAppendixHtml}</div>
    </section>

    <section class="section card limitations">
      <span class="eyebrow">Interpretive and technical limitations</span>
      <h2>Read this report with care</h2>
      <ul>
        <li>The AI reading does not validate qualitative findings, establish correctness, or replace a second human coder.</li>
        <li>Descriptive human–AI overlap is not intercoder reliability. Cohen’s kappa is not calculated for the mock reviewer.</li>
        ${secondCoderSummary.total > 0 ? '<li>The optional second-human records cover only a subset of excerpts and are reported descriptively, separately from AI review.</li>' : ''}
        <li>${usedOpenAi ? 'A remote model was used; interpret its output under the recorded provider, consent, governance, and retention conditions.' : 'The deterministic mock reviewer demonstrates workflow and auditability, not model quality.'}</li>
        <li>Human decisions made after seeing AI output may be affected by anchoring or automation bias.</li>
        <li>${options.includeSourceText ? 'This report contains source excerpts and evidence quotes. Govern it like the underlying research data.' : 'Source excerpts and evidence quotes were omitted, but codes, rationales, and reflexive memos may still contain sensitive or identifying information.'}</li>
      </ul>
    </section>

    <footer>
      Generated by QualiAudit. The report contains no embedded scripts or external network resources.
    </footer>
  </main>
</body>
</html>`
}
