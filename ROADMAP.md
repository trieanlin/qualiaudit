# Roadmap

This roadmap treats product, methodological, governance, and engineering work as one system. Priorities may change after researcher testing.

## Phase 0 — vertical slice (v0.1, complete)

- Synthetic no-login review.
- Codebook and coded-excerpt CSV import.
- Immutable first-pass snapshot and blind deterministic review.
- Method-aware review queue and case resolution.
- Decision log and CSV/JSON audit export.
- Baseline accessibility, responsive design, tests, and public project documentation.

## Phase 1 — trustworthy import and project portability

- [x] Excel (`.xlsx`) import with sheet/header/column mapping.
- [x] Transparent mapping profiles for selected NVivo/MAXQDA/ATLAS.ti tabular `.xlsx` exports, without parsing proprietary project files.
- [x] In-browser project file export/import so reviews can move between devices without a cloud account.
- [x] Clear local-data deletion and encrypted-at-rest feasibility study.
- [x] Larger validation corpus covering CSV dialects, Unicode, multi-code cells, and segment boundaries.

## Phase 2 — optional real reviewer adapter

- [x] Server-side provider adapter foundation; no API key in browser code.
- [x] Preflight disclosure of provider, region, retention, and exact fields sent.
- [x] Explicit consent before transmission and a local mock fallback.
- [x] Versioned prompt/schema registry and reproducibility metadata.
- [x] Schema validation, human-initiated retry handling, unsupported-code detection, and first request-size/count guardrails.
- [x] Initial engineering threat model and deployment gate.
- [ ] Institutional data-governance, ethics, privacy, and contractual review before claiming suitability for real research data.

## Phase 3 — richer audit practice

- [x] Self-contained HTML audit report with optional excerpt-level evidence and print-to-PDF styles.
- [x] Codebook change ledger with before/after definitions and affected excerpts.
- [x] Batch triage that never hides unresolved or low-context cases.
- [x] Researcher-authored reflexive memos linked to decision events.
- [x] Optional second-human-coder comparison kept analytically separate from AI review.

Phases 1–3 form the v0.2.0 release scope. The remaining items below require human evaluation, advisor input, assistive-technology testing, or institutional review; they are not represented as completed by the software release.

## Phase 4 — research and evaluation

- [x] Publish an ethics-gated, synthetic-data formative evaluation kit before recruitment.
- [ ] Usability study with doctoral and professional qualitative researchers.
- [ ] Evaluate anchoring, automation bias, interpretive diversity, and rationale quality.
- [ ] Publish limitations and negative findings alongside workflow changes.
- [ ] Develop method-specific guidance with qualitative-methods advisors.

## Cross-cutting quality

- [x] Accessibility engineering pass with automated semantic checks, keyboard interaction tests, focus management, responsive reflow review, and reduced-motion handling.
- [ ] Complete and publish a task-based VoiceOver/Safari and NVDA/Firefox assistive-technology matrix before making a WCAG 2.2 AA conformance claim.

## Deliberately out of scope

Automatic final themes, claims of AI validation, native proprietary project parsing, full-text autonomous analysis, public handling of sensitive data, and generic dashboard metrics remain outside the product direction unless strong research evidence changes the case.
