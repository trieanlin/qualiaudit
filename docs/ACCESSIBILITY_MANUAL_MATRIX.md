# Assistive-technology manual test matrix

> **Status: IN PROGRESS — NO CONFORMANCE CLAIM**
>
> This matrix records task-based manual checks. An item remains `Not run` until
> a person has completed the task with the named browser and assistive
> technology. Automated tests, DOM inspection, or sighted keyboard testing do
> not count as a manual screen-reader pass.

## Test environment

| Field | VoiceOver / Safari | NVDA / Firefox |
| --- | --- | --- |
| Date | 2026-07-26 to 2026-07-27 | Not run |
| QualiAudit build | `b42d8cf` or later | Not run |
| Operating system | macOS 26.5.2 | Not run |
| Browser version | Safari 26.5.2 | Not run |
| Assistive-technology version | VoiceOver bundled with macOS 26.5.2 | Not run |
| Input | Keyboard | Not run |
| Data | Bundled fictional synthetic demo only | Not run |

Allowed result values are `Pass`, `Fail`, `Needs retest`, `Blocked`, and
`Not run`. A pass requires the expected information and state to be available
without sighted assistance.

## VoiceOver / Safari tasks

| ID | Task and expected result | Result | Observed result / issue |
| --- | --- | --- | --- |
| VO-SAF-01 | Open the landing page. The page purpose, main heading, and **Open synthetic review** button are discoverable in a meaningful order. | Pass | Maintainer reported that VoiceOver announced the heading, product introduction, and button in a sensible order, with no unexpected blank or repeated content. |
| VO-SAF-02 | Activate **Open synthetic review**. Focus moves to and announces the new **Inspect the record that will be frozen** heading without returning to the top of the page. | Pass | After keyboard activation, VoiceOver announced: “Heading level 1. Inspect the record that will be frozen. You are currently in the heading level 1.” |
| VO-SAF-03 | Open **Project brief**. Project fields have names; the selected analysis approach is announced; changing to Reflexive Thematic Analysis exposes its pressed state and method explanation. | Fail | VoiceOver announced the heading, field names, method names, pressed state, and changed explanation, but leaving through the stage sidebar bypassed form submission and discarded the Reflexive selection. |
| VO-SAF-03-R1 | Retest VO-SAF-03 after preventing later-stage navigation while the project brief has unsaved changes and clarifying the save action. | Pass | Retested 2026-07-27. The completed queue announced **Reflexive mode**, confirming that the saved selection persisted. |
| VO-SAF-04 | Return to **Review materials**. The Codebook and Human-coded excerpts tabs expose tab, selected, and count information; keyboard movement changes the selected tab predictably. | Pass | Maintainer reported that VoiceOver announced both tabs, their counts and selected state; both panels could be selected and their corresponding table content found without a mouse. |
| VO-SAF-05 | Open **Prepare blind review**. Reviewer-visible and withheld information, reviewer choice, local-data destination, and the freeze action are understandable before activation. | Pass | Maintainer reported that the visible/withheld field lists, both reviewer choices and states, local no-transmission message, API-key boundary, and freeze action were all available and understandable with VoiceOver. |
| VO-SAF-06 | Run the deterministic review. Progress is announced without repeatedly reading the whole page; completion moves to the review queue heading. | Fail | The first reported announcement after activation was “3 of 8, you are currently in a text element” on the completed queue's direct-overlap metric, not the running progress. |
| VO-SAF-06-R1 | Retest VO-SAF-06 after exposing the visible excerpt counter as an atomic status message. | Pass | Retested 2026-07-27. The local mock completed too quickly for VoiceOver to finish announcing intermediate counters, but it did not repeat the whole page and moved directly to the completed view, announcing **Review queue**, **Reflexive mode**, and **Read across the divergence**. The fast local operation does not warrant an artificial delay. |
| VO-SAF-07 | In the queue, method framing, active filter, case identity, human code, AI reading, and uncertainty are distinguishable. Changing filters exposes the new pressed state. | Pass | Maintainer confirmed that VoiceOver announced the active/pressed state when switching the queue filters and that the case summary information was distinguishable. |
| VO-SAF-08 | Open a case. The excerpt, frozen human reading, independent reading, evidence, uncertainty, and relevant code definitions are understandable in reading order. | Pass | Maintainer confirmed that a case could be opened and that the excerpt, separate human records, independent AI reading, evidence, uncertainty, relevant definitions, and resolution section were understandable in a natural order. |
| VO-SAF-09 | In Human resolution, the nine options behave as one radio group. Saving an empty form announces and focuses an actionable error; entering a decision and rationale can be completed without sighted help. | Pass | VoiceOver announced the resolution position as “1 of 9” and updated the number while moving through the radio options. A four-character rationale could not be submitted and VoiceOver announced the validation error; after extending it beyond eight characters, the maintainer saved the decision and returned to the Independent review stage without sighted assistance. |
| VO-SAF-10 | Open **Data & privacy**. The dialog title is announced, focus stays inside with Tab/Shift+Tab, Escape closes it, and focus returns to the opener. | Pass | The dialog title, focus containment, dismissal, and return to the previous interface were all announced correctly. The maintainer also exercised the destructive path: navigating to the clear-data action, both confirmation steps, the deletion-complete state, and exit back to the previous interface were all operable and announced correctly. |
| VO-SAF-11 | Open the audit trail and HTML-report options. Export purpose, source-text choice, selected option, privacy warning, and download action are understandable. | Pass | VoiceOver clearly announced the audit heading, HTML-report expanded state, both quoted-source-material options and their selected states, the corresponding privacy warning, and the download action. |

## NVDA / Firefox tasks

Repeat `VO-SAF-01` through `VO-SAF-11` with NVDA and Firefox. Record results
under IDs `NVDA-FF-01` through `NVDA-FF-11`; do not infer them from the
VoiceOver results.

Status: `Not run`.

## Separate visual/manual checks

These checks are not screen-reader substitutes and need their own evidence:

- 200% and 400% browser zoom with no loss of information or two-dimensional
  scrolling for ordinary content;
- WCAG text-spacing overrides;
- non-text contrast for focus, selected, warning, and error states;
- reduced-motion behaviour at operating-system and browser level;
- unusually long code names, excerpts, rationales, and translated text.

## Safari zoom and text-spacing tasks

Environment: macOS 26.5.2, Safari 26.5.2, keyboard and bundled fictional
synthetic data. Test dates and exact observations belong in the table below.
At 400% zoom, ordinary page content must reflow without requiring horizontal
page scrolling. A contained horizontal region remains acceptable for data
tables whose two-dimensional relationships need to stay visible.

| ID | Task and expected result | Result | Observed result / issue |
| --- | --- | --- | --- |
| ZTS-SAF-01 | At 200% and 400% zoom, inspect the landing page. The heading, introduction, reassurance, and all three project-entry actions remain visible, readable, and operable without horizontal page scrolling. | Pass | At both 200% and 400% zoom on 2026-07-27, the landing page reflowed cleanly: no overlap, lost content, unusable action, or horizontal page scrolling was observed. |
| ZTS-SAF-02 | At 400% zoom, open the synthetic review and inspect Project brief, Review materials, and Prepare blind review. Stage navigation and primary actions remain reachable; content does not overlap or disappear. A data table may scroll inside its labelled table region. | Pass | At 400% zoom on 2026-07-27, stage navigation, material controls, contained data tables, reviewer-boundary information, and the freeze action remained visible and operable without overlap, lost content, or horizontal page scrolling. |
| ZTS-SAF-03 | At 400% zoom, run the mock review, change queue filters, open a case, trigger and correct a resolution error, and save a decision. Queue cards, controls, definitions, radio options, errors, and actions reflow without horizontal page scrolling. | Pass | At 400% zoom on 2026-07-27, review progress, queue views and filters, case comparison, code definitions, resolution controls, validation feedback, and decision saving remained readable and operable without overlap, lost content, or horizontal page scrolling. |
| ZTS-SAF-04 | At 400% zoom, open Data & privacy and the audit trail's HTML-report options. Dialog content, confirmations, export choices, privacy warning, and actions remain visible and operable without clipped text. | Pass | At 400% zoom on 2026-07-27, the local-data dialog and audit trail—including export controls, HTML-report source-text choices, privacy messaging, and actions—remained readable and operable without overlap, clipping, lost content, or horizontal page scrolling. |
| ZTS-SAF-05 | With WCAG text-spacing overrides applied (line height 1.5, paragraph spacing 2× font size, letter spacing 0.12 em, word spacing 0.16 em), repeat the landing, materials, queue, case, dialog, and audit checks. No text or control is clipped, overlapped, or lost. | Pass | On 2026-07-27, the landing, Review materials, freeze, queue, case-resolution, Data & privacy, and audit views all remained readable and operable with the required spacing overrides. Text became more widely spaced without clipping, overlap, lost content, unusable controls, or horizontal page scrolling. |

## Safari reduced-motion and non-text-contrast tasks

Environment: macOS 26.5.2, Safari 26.5.2, keyboard and bundled fictional
synthetic data. Reduced-motion checks use the operating-system accessibility
setting rather than a console override. Contrast checks cover the visible
boundaries and state indicators needed to identify and operate controls; they
do not replace screen-reader or text-contrast testing.

| ID | Task and expected result | Result | Observed result / issue |
| --- | --- | --- | --- |
| RMC-SAF-01 | Enable **Reduce motion** in macOS, reload the landing page, and open the synthetic review. No decorative animation, smooth scrolling, or transition is required to understand or operate the page; page changes remain clear. | Pass | On 2026-07-27 with the macOS Reduce motion setting enabled, the landing and synthetic-review page changes remained clear and fully operable; no motion was required to understand the navigation. |
| RMC-SAF-02 | With **Reduce motion** still enabled, freeze the record and run the mock review. The progress state and completion remain understandable without relying on orbiting, pulsing, or animated movement. | Pass | On 2026-07-28 with Reduce motion enabled, the maintainer completed the freeze and mock-review transition without relying on animation; progress and completion remained understandable from the visible text and page structure. |
| RMC-SAF-03 | Use Tab and Shift+Tab on the landing, stage navigation, queue filters, a case, Data & privacy, and audit controls. The current keyboard focus remains visibly identifiable on every operable element. | Pass | On 2026-07-28, the maintainer traversed the landing, review stages, queue, case, local-data dialog, and audit controls with Tab and Shift+Tab. Keyboard focus remained clearly visible and was not clipped or lost on any tested operable element. |
| RMC-SAF-04 | Inspect selected tabs, analysis-method choices, queue filters, radio decisions, and HTML-report source-text choices. Selected state remains distinguishable through a visible boundary, indicator, icon, or text—not colour alone. | Pass | On 2026-07-28, the maintainer checked analysis-method choices, material tabs, queue filters, resolution options, and HTML-report choices. Every tested selected state remained visibly identifiable through boundaries, indicators, position, or control state rather than colour alone. |
| RMC-SAF-05 | Trigger representative warning and error states in Review materials or Human resolution, and inspect the remote-review warning shown when it is unavailable. Warning/error regions and their controls remain distinguishable from adjacent surfaces and include text or icon cues—not colour alone. | Pass | On 2026-07-28, the maintainer triggered a Human resolution validation error and inspected the unavailable remote-review warning. Both states were recognisable through explicit text, iconography, and a visually distinct region rather than colour alone. |

## Safari long and mixed-language content tasks

Environment: macOS 26.5.2, Safari 26.5.2, keyboard, and the fictional files
in `test-fixtures/accessibility`. These fixtures deliberately contain long
unbroken code identifiers, long English and Chinese excerpts, long rationales,
mixed-language context, and long source labels. They do not contain real
research data.

| ID | Task and expected result | Result | Observed result / issue |
| --- | --- | --- | --- |
| LUC-SAF-01 | Import the long/mixed-language codebook and excerpts. Validation completes without corrupting Unicode or silently shortening identifiers, and both material tables remain readable through wrapping or contained table scrolling. | Pass | On 2026-07-29, Safari imported all 7 code definitions and both excerpts from the fictional fixture files. Long English identifiers and Chinese text remained intact, and both material tables stayed readable through their contained table regions. |
| LUC-SAF-02 | Freeze the imported record and run the local mock reviewer. The checkpoint, progress state, and queue complete without overflow, missing records, or an invalid reviewer code. | Pass | On 2026-07-29, the checkpoint showed 2 excerpts and 7 codes, the local deterministic reviewer completed, and the queue contained both records with valid codebook readings. |
| LUC-SAF-03 | Inspect the queue and open both cases. Long human codes, source labels, excerpts, rationales, second-coder records, AI readings, and definitions wrap or reflow without covering controls or disappearing. | Fail | On 2026-07-29, the queue and both excerpts remained readable, but the first case's long unbroken English first-human code crossed its comparison column and covered the Chinese second-human code. The Chinese-first case wrapped normally. This is a visible information-overlap defect for long Latin-script identifiers. |
| LUC-SAF-03-R1 | Retest both case views after allowing unbroken code identifiers to wrap inside bounded comparison columns. No first- or second-human code may overlap the other column at desktop or narrow widths. | Not run | Awaiting preview retest after the wrapping fix. |
| LUC-SAF-04 | Resolve one case with a deliberately long mixed-language rationale, then inspect the decision log and codebook-change or memo controls that become available. Saved content remains readable and associated with the correct case. | Not run | — |
| LUC-SAF-05 | Export reviewed CSV, JSON audit, and an HTML report containing source text. Reopen or inspect each file and confirm the complete long identifiers and Chinese text remain present and readable without character corruption. | Not run | — |

## Issue record format

For every failure or uncertain result, record:

- test ID and task;
- browser, operating system, and assistive-technology versions;
- exact steps;
- expected and observed announcement or behaviour;
- whether sighted help was required;
- severity and user impact;
- screenshot or recording only when it contains no sensitive information;
- linked fix and regression test;
- retest result.

Do not rewrite a failed result as passed after a fix. Preserve the original
observation and add a dated retest entry.
