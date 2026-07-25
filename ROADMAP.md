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
- [ ] Import profiles for common NVivo/MAXQDA/ATLAS.ti tabular exports, without parsing proprietary project files.
- [x] In-browser project file export/import so reviews can move between devices without a cloud account.
- [x] Clear local-data deletion and encrypted-at-rest feasibility study.
- [ ] Larger validation corpus covering CSV dialects, Unicode, multi-code cells, and segment boundaries.

## Phase 2 — optional real reviewer adapter

- [ ] Server-side provider adapter; no API key in browser code.
- [ ] Preflight disclosure of provider, region, retention, and exact fields sent.
- [ ] Explicit consent before transmission and a local mock fallback.
- [ ] Versioned prompt/schema registry and reproducibility metadata.
- [ ] Schema validation, retry handling, unsupported-code detection, and cost guardrails.
- [ ] Threat model and institutional data-governance review before claiming suitability for real research data.

## Phase 3 — richer audit practice

- [ ] HTML/PDF audit report with excerpt-level evidence and print styles.
- [ ] Codebook change ledger with before/after definitions and affected excerpts.
- [ ] Batch triage that never hides unresolved or low-context cases.
- [ ] Researcher-authored reflexive memos linked to decision events.
- [ ] Optional second-human-coder comparison kept analytically separate from AI review.

## Phase 4 — research and evaluation

- [ ] Usability study with doctoral and professional qualitative researchers.
- [ ] Evaluate anchoring, automation bias, interpretive diversity, and rationale quality.
- [ ] Publish limitations and negative findings alongside workflow changes.
- [ ] Develop method-specific guidance with qualitative-methods advisors.

## Deliberately out of scope

Automatic final themes, claims of AI validation, native proprietary project parsing, full-text autonomous analysis, public handling of sensitive data, and generic dashboard metrics remain outside the product direction unless strong research evidence changes the case.
