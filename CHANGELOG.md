# Changelog

All notable changes to QualiAudit are documented here. The project follows [Semantic Versioning](https://semver.org/) once stable releases begin.

## [Unreleased]

### Added

- An ethics-gated formative evaluation kit for the fictional synthetic demo,
  including method-sensitive research questions, a neutral moderated-session
  guide, privacy-minimised observation template, negative-case analysis plan,
  and explicit pre-recruitment governance gate.
- A clearly labelled internal, non-participant dry-run record covering both
  method routes without presenting the rehearsal as product-validation
  evidence.

### Changed

- The moderated session guide now directs participants from the demo's initial
  Review materials screen to Project brief before method and material
  orientation.

## [0.2.0] - 2026-07-26

### Added

- An optional server-side OpenAI Responses API adapter with no provider key in browser code.
- A pre-transmission disclosure covering provider, configured model, region label, retention warning, `store=false`, and exact blind-review fields.
- Versioned explicit consent, manual local-mock fallback, and no silent retry after an interrupted remote request.
- Server-side payload re-allowlisting plus strict provider-output, codebook, excerpt-ID, evidence-quote, size, and count validation.
- A named prompt/schema protocol registry with model, schema, client request, provider request, and provider response provenance in audit exports.
- Server/browser timeouts, safe provider error classes, bounded rate-limit recovery guidance, and an initial public threat model.
- Browser-local Excel (`.xlsx`) import for codebooks and human-coded excerpts.
- Worksheet selection, header-row detection, explicit column mapping, and a four-row source preview.
- A downloadable fictional two-sheet workbook and an in-app “Try Excel sample” path.
- File-size and row-count guardrails, Chinese/common export-header aliases, and workbook fixture tests.
- Versioned, browser-local QualiAudit project export and restore.
- A restore preview showing project identity, method, progress, counts, and export date before state replacement.
- Strict project-file validation, safe rejection of malformed/future-version files, and recovery tests for frozen reviews and decision logs.
- Clear separation between resumable project files and non-resumable audit JSON exports.
- A Data & privacy dialog that reports locally retained review counts and approximate size.
- Confirmed deletion of QualiAudit’s browser record without clearing unrelated local-storage keys.
- Public encryption-at-rest feasibility guidance and explicit downloaded-file deletion boundaries.
- Automatic comma, semicolon, and tab-delimiter detection with UTF-8 BOM and multiline quoted-field support.
- Safe rejection of duplicated headers, malformed row widths, unclosed quotes, oversized text imports, and unsupported multi-code primary cells.
- Unicode-normalized code checks, optional second-coder code validation, segment-boundary warnings, and a fictional import regression corpus.
- Visible, editable import-profile suggestions for selected NVivo codebook/coding-report, MAXQDA retrieved-segment, and ATLAS.ti quotation-report `.xlsx` layouts.
- Conservative multi-signal profile detection, manual fallback for unresolved fields, explicit native-project boundaries, and a fictional four-sheet interoperability fixture.
- An append-only codebook-change ledger for “Revise codebook” resolutions with frozen before/proposed after guidance, author, rationale, timestamp, affected excerpts, and unresolved recoding work.
- Append-only researcher reflexive memos with author, timestamp, linked excerpt, and the human decision snapshot that prompted the memo.
- A distinct optional second-human-coder comparison with method-sensitive overlap/divergence language, separate queue and case framing, and an independent audit section.
- CSV second-human fields plus audit JSON schema version 0.5 and HTML report version 0.3 records that explicitly exclude human–human counts from AI queue categories and reliability claims.
- Safe queue triage groups that keep every unresolved case visible, pin context/confidence/boundary/ambiguity/unsupported-reading concerns first, and never batch-resolve or automatically recode material.
- Audit JSON schema version 0.6 and HTML report version 0.4 records that disclose the non-decisional triage policy outside the interface.
- Project-file schema version 3 with safe version 1/2 migration, reflexive-memo and codebook-ledger integrity checks, and linked resolution events.
- Audit bundle schema version 0.4 introduced reflexive memos, codebook-change history, and a flattened unresolved-recoding list.
- A self-contained printable HTML audit report with project context, method statement, reviewer provenance, frozen codebook, decision and reflexive-memo logs, unresolved cases, codebook changes, and limitations.
- Privacy-minimised HTML export by default, with source excerpts, context, and AI evidence quotes included only after an explicit researcher choice.
- Script-free report output with escaped imported content, a restrictive content-security policy, responsive layout, and dedicated print styles for browser PDF creation.
- An end-to-end accessibility engineering pass covering page-change focus, modal focus containment and restoration, keyboard-operable tabs and decision radios, form-error focus, status/progress semantics, table captions, and higher-contrast focus indicators.
- Automated `axe-core` checks for representative workflow states plus interaction tests for keyboard patterns, progress semantics, and dialog behaviour.
- A public accessibility audit record that separates completed engineering checks from the remaining VoiceOver, NVDA, zoom, and cross-browser verification.

## [0.1.0] - 2026-07-22

### Added

- Synthetic, clearly labelled qualitative coding review project.
- Method-aware setup for codebook/framework and reflexive thematic analysis.
- CSV-shaped codebook and human-coded excerpt import with rule-based validation.
- Time-stamped freeze checkpoint and tested blind-review payload boundary.
- Deterministic local mock reviewer with structured evidence, rationale, uncertainty, context, and codebook-issue fields.
- Human–AI comparison queue with method-sensitive category language.
- Nine human resolution paths with required rationale and post-exposure change tracking.
- Decision log, reviewer provenance, draft methods statement, and CSV/JSON exports.
- Responsive visual system, keyboard-visible native controls, skip link, and reduced-motion handling.
- Automated linting, type checking, unit tests, and production build.
