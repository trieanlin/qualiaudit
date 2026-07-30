# QualiAudit v0.2.1

QualiAudit v0.2.1 is a compatibility and research-readiness patch for the v0.2
research prototype. It does not expand AI decision authority or change the
blind-review boundary. The public synthetic demo still defaults to the
deterministic reviewer running locally in the browser.

## Accessibility and interaction fixes

- Project setup now announces a clearer save-and-continue action and prevents
  users from entering later stages before the project brief has been saved.
- Blind-review progress exposes an atomic status update for assistive
  technologies.
- Long unbroken identifiers wrap within bounded human, second-human, AI,
  codebook, decision-log, and audit-report regions.
- Human-comparison layouts reflow safely at narrow widths instead of allowing
  one interpretation to cover another.

## Manual verification added

The public accessibility record now includes task-based Safari checks for:

- keyboard and VoiceOver navigation through the full synthetic workflow;
- page headings, selected controls, validation errors, dialogs, and deletion;
- browser zoom and WCAG text-spacing overrides;
- reduced-motion and contrast preferences;
- long English identifiers, Chinese text, mixed-language rationales, and
  responsive reflow;
- reviewed CSV, JSON audit, and full-source HTML report integrity.

An observed long-identifier overlap remains preserved in the test record
alongside its passing branch-preview retest. This release still makes no formal
WCAG conformance claim; NVDA/Firefox verification remains outstanding.

## Research-readiness materials

- An ethics-gated formative evaluation kit provides research questions,
  governance gates, a neutral moderated-session guide, observation template,
  and a negative-case analysis plan.
- A clearly labelled internal synthetic dry run documents protocol defects
  without presenting the rehearsal as participant evidence or product
  validation.

## Compatibility

- Existing browser records remain under the same storage key.
- Portable project-file schema version 3 and its version 1/2 migrations are
  unchanged.
- Reviewer, prompt, consent, memo, ledger, and audit schema identifiers are
  unchanged because their underlying contracts did not change.
- Project files created by this release record application version `0.2.1`.

## Important limits

- Use the public demo only with fictional data. Do not use this prototype with
  sensitive, identifiable, embargoed, or regulated research material.
- The optional provider boundary is an engineering safeguard, not
  institutional ethics, privacy, contractual, or data-governance approval.
- The deterministic reviewer demonstrates the workflow, not model quality.
- Human–AI overlap is not intercoder reliability, methodological validation,
  or evidence of correctness.
- Research with qualitative researchers and NVDA/Firefox assistive-technology
  testing remain future work.

## Release gates

Before tagging this release:

1. Run `npm run check`.
2. Run `npm run check:release`.
3. Complete the local synthetic workflow through one recorded decision and
   audit export.
4. Confirm that the public deployment still defaults to the local reviewer.
5. Confirm that GitHub CI and Vercel deployment checks pass on the release pull
   request.

See the [release checklist](RELEASE_CHECKLIST.md), [security guidance](../SECURITY.md),
[accessibility audit](ACCESSIBILITY_AUDIT.md), and
[manual accessibility matrix](ACCESSIBILITY_MANUAL_MATRIX.md).
