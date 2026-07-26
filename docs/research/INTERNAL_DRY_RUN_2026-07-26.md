# Internal protocol dry-run — 2026-07-26

> **Status: INTERNAL DRY-RUN — NOT PARTICIPANT DATA**
>
> This record documents a study-team rehearsal with QualiAudit's fictional
> synthetic demo. No participant was recruited, observed, or recorded. The
> results are not evidence of usability, effectiveness, reduced automation
> bias, methodological quality, or suitability for real research data.

## Purpose and boundary

The rehearsal checked whether the moderated session guide can be followed
through both supported analysis routes and whether the resulting browser-local
audit record preserves the intended methodological and data-governance
boundaries.

- Build inspected: commit `56438a8`
- Environment: local Vite development build in a browser
- Data: the bundled, clearly labelled fictional sample only
- Reviewer: local deterministic mock reviewer
- Remote transmission: none
- Downloads retained: none
- Recruitment and consent procedure: not applicable; this was not a research
  session

## Routes rehearsed

### Codebook / Framework Analysis

The rehearsal:

1. inspected the project brief, five-code codebook, eight human-coded excerpts,
   and the separate optional second-human record;
2. verified that the freeze checkpoint listed the allowlisted reviewer fields
   and withheld human codes, rationales, confidence, second-coder decisions,
   later decisions, and resolution history;
3. ran the local reviewer and inspected overlap, divergent, ambiguity,
   boundary, and insufficient-context cases;
4. recorded a fictional `Revise codebook` decision with frozen-before and
   proposed-after guidance plus unresolved recoding work;
5. confirmed that the decision and codebook-change event appeared in the audit
   trail; and
6. inspected the privacy-minimised HTML-report choice and the browser-local data
   boundary and deletion explanation.

The queue used descriptive overlap and ambiguity language and explicitly
separated this comparison from intercoder reliability. It did not calculate
Cohen's kappa or present the AI reading as a validated answer.

### Reflexive Thematic Analysis

The rehearsal:

1. selected Reflexive Thematic Analysis before freezing the human record;
2. confirmed that the checkpoint described reflexive framing and the same blind
   review boundary;
3. ran the local reviewer and inspected the method-specific queue;
4. recorded a fictional `Keep both interpretations` decision for an alternative
   reading;
5. added an append-only researcher reflexive memo linked to that decision; and
6. confirmed that the decision, memo, provenance, and method-specific draft
   AI-use statement appeared in the audit trail.

The interface used `alternative reading`, `productive divergence`,
`interpretive overlap`, and `reflexivity` language. It did not frame divergence
as error or use accuracy or reliability scoring.

## Material correction made

The synthetic demo opens on **Review materials**, while Task 1 asks for
orientation to the project and method. The session guide now explicitly asks
the participant to open **Project brief** before inspecting the codebook and
excerpts. This is a protocol-clarity correction from an internal rehearsal, not
a participant finding.

## Gate outcome

The two synthetic routes can be rehearsed end to end with the current guide.
This does **not** complete the governance gate. Recruitment remains blocked
until the responsible study team supplies and approves the local ethics,
consent, privacy, accessibility, data-management, withdrawal, and incident
procedures listed in `GOVERNANCE_GATE.md`.

The next appropriate research step is a human-facilitated study-team rehearsal
of the approved local materials, followed by advisor and governance review. Any
future participant observation must be recorded separately and must not be
combined with this dry-run record as though it were study evidence.
