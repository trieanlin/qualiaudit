# Accessibility engineering audit

This document records the first end-to-end accessibility engineering pass for QualiAudit. It is an inspectable quality record, not a certification or a claim that every browser and assistive-technology combination conforms to WCAG.

## Scope and reference points

The audit covers the synthetic workflow from landing page through materials, freeze/review progress, queue, case resolution, audit export, and the project/import/privacy dialogs.

The implementation is reviewed against [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level A and AA expectations and the WAI-ARIA Authoring Practices patterns for [modal dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), and [radio groups](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

## What this pass changed

- Page changes move focus to the new primary heading so keyboard and assistive-technology users receive a clear navigation cue.
- Modal dialogs receive initial focus, keep `Tab` and `Shift+Tab` within the modal, close with `Escape`, and return focus to the control that opened them.
- Review-material tabs use a labelled tab list, linked tab panels, roving `tabindex`, and arrow/Home/End navigation.
- Human-resolution choices expose radio-group state and support arrow-key selection while preserving the nine visible decision paths.
- Invalid resolution forms focus a visible alert summary and mark invalid fields without relying on colour.
- Import status, validation state, remote-review failures, filter state, and deterministic-review progress have explicit accessible semantics.
- Data tables have accessible captions and column-header scope.
- The shared focus indicator now exceeds a 3:1 contrast ratio against the principal paper surfaces; controls that had suppressed outlines no longer do so.
- Small standalone controls receive a larger keyboard/pointer target, while the existing reduced-motion override remains active.

## Automated and interaction evidence

The Vitest suite uses `axe-core` on representative landing, materials, case-resolution, and modal-dialog states. Because jsdom does not perform layout or calculate rendered colours, the automated colour-contrast rule is disabled there and contrast is reviewed separately.

Interaction tests cover:

- tab-list arrow and Home-key behaviour;
- decision radio-group arrow behaviour;
- invalid-form alert focus;
- dialog initial focus, forward/reverse focus wrapping, `Escape`, and focus restoration;
- determinate progress-bar values without a whole-page live region.

Run the evidence locally:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

## Manual browser checks

The engineering pass includes the synthetic review workflow at desktop and narrow mobile-width layouts, keyboard-only navigation, visible focus, modal focus containment, and reflow/overflow inspection. Stylesheet inspection confirms that transitions and animations are collapsed under `prefers-reduced-motion: reduce`; operating-system and browser-level reduced-motion checks remain part of the wider manual matrix.

## Remaining verification

Before describing QualiAudit as conforming to WCAG 2.2 AA, the project still needs:

- task-based VoiceOver with Safari testing on macOS/iOS;
- task-based NVDA with Firefox or Chrome testing on Windows;
- a documented 400% zoom and text-spacing matrix across supported browsers;
- manual non-text contrast review for every state, including imported error/warning combinations;
- testing with unusually long imported code names, excerpts, rationales, and translated interface text.

Any issue found in those checks should be tracked by screen, user task, browser/assistive technology, expected result, observed result, severity, and regression test.
