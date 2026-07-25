# Changelog

All notable changes to QualiAudit are documented here. The project follows [Semantic Versioning](https://semver.org/) once stable releases begin.

## [Unreleased]

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
