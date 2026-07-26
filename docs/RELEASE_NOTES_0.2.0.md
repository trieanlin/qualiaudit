# QualiAudit v0.2.0

QualiAudit v0.2.0 turns the original synthetic vertical slice into a more portable and inspectable research prototype. The release keeps the same core position: AI provides an independent reading, not a final answer, validity check, or substitute for a second human researcher.

## What is new

### Trustworthy import and local portability

- Browser-local CSV, TSV, and Excel import with validation, sheet selection, header detection, explicit mapping, and source preview.
- Conservative mapping suggestions for selected tabular NVivo, MAXQDA, and ATLAS.ti exports, without claiming native project-file support.
- Versioned QualiAudit project files with a restore preview, structural validation, and safe migration from earlier schemas.
- An inspectable local-data inventory and confirmed deletion of QualiAudit’s browser record.

### Optional real-reviewer boundary

- A disabled-by-default, server-side OpenAI Responses API adapter.
- Exact-field disclosure and versioned consent before transmission.
- A second server-side allowlist, strict structured-output validation, timeouts, safe provider errors, and no silent retry.
- Model, prompt, schema, consent, request, and provider provenance in audit exports.

The public synthetic demo still defaults to the deterministic browser-local reviewer and requires no provider key.

### Richer human-led audit practice

- A self-contained, printable HTML audit report with a privacy-minimised default.
- Append-only reflexive memos linked to recorded decisions.
- An append-only codebook-change ledger that preserves the frozen baseline and unresolved recoding work.
- A separate optional second-human comparison that does not alter human–AI queue categories or produce an intercoder-reliability claim.
- Safe, non-decisional triage groups that never hide unresolved cases or batch-accept AI suggestions.

### Accessibility engineering

- Page-change focus, modal focus containment and restoration, keyboard-operable tabs and decision radios, form-error focus, progress semantics, table captions, stronger focus indicators, and responsive reflow improvements.
- Automated axe checks and interaction tests for representative workflow states.

The manual VoiceOver/Safari and NVDA/Firefox task matrix remains incomplete, so this release does not claim formal WCAG conformance.

## Compatibility

- The browser storage key remains unchanged so the release can read an existing local v0.1 working record.
- Project-file schema version 3 accepts and migrates supported version 1 and 2 files.
- Internal reviewer, prompt, memo, ledger, and export schema labels keep their historical versions. They are provenance and compatibility identifiers, not the application release number.

## Important limits

- Use the public demo only with fictional data. Do not use this prototype with sensitive, identifiable, embargoed, or regulated research material.
- Browser storage, downloaded project files, JSON exports, and HTML reports are not encrypted containers.
- The optional provider boundary is an engineering safeguard, not institutional ethics, privacy, contractual, or data-governance approval.
- The deterministic reviewer demonstrates the workflow, not model quality.
- Human–AI overlap is not intercoder reliability, methodological validation, or evidence of correctness.
- Research on anchoring, automation bias, rationale quality, interpretive diversity, and method-specific guidance remains future work.

## Release gates

Before tagging this release:

1. Run `npm run check`.
2. Run `npm run check:release`.
3. Complete the synthetic demo from freeze through at least one decision and audit export.
4. Confirm that the public deployment still defaults to the local reviewer.
5. Confirm that GitHub CI and deployment checks pass on the release pull request.

See the full [release checklist](RELEASE_CHECKLIST.md), [security guidance](../SECURITY.md), [threat model](THREAT_MODEL.md), and [roadmap](../ROADMAP.md).
