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
