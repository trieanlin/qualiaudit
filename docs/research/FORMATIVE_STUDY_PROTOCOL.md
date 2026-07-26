# Formative study protocol

**Protocol status:** Draft for advisor and institutional review

**Product status:** QualiAudit research prototype

**Data permitted by this draft:** Fictional synthetic demo only

**Study status:** Not started

## Purpose

The study asks whether QualiAudit’s review workflow helps qualitative researchers
inspect human–AI divergence while retaining interpretive agency and a usable
audit trail. It also looks for ways the interface may narrow interpretation,
encourage uncritical adoption, create unnecessary friction, or misrepresent a
participant’s analytic method.

The study is formative. It is designed to identify product and methodological
problems, not to establish efficacy, productivity, generalisability, or causal
effects.

## Research questions

1. Can researchers explain the blind-review boundary and identify which
   information the reviewer did and did not receive?
2. How do researchers use excerpt evidence, context, codebook guidance,
   uncertainty, and their own analytic commitments when responding to an
   alternative reading?
3. What changes after AI exposure: the selected code, the rationale, the segment
   boundary, the codebook, the researcher’s uncertainty, or nothing?
4. When do researchers keep, reject, combine, or intentionally leave an AI
   reading unresolved, and what reasons do they give?
5. Does the interface preserve method-specific practice?
   - In **Codebook / Framework Mode**, can participants inspect consistency and
     code ambiguity without treating human–AI overlap as validation?
   - In **Reflexive Mode**, can participants use divergence as a reflexive prompt
     without the interface implying error, accuracy, or a required consensus?
6. Where do queue structure, labels, defaults, visual hierarchy, or reviewer
   wording appear to anchor attention or discourage interpretive diversity?
7. What usability, accessibility, governance, or documentation failures would
   make the workflow inappropriate for further study?

## Explicit non-questions

This study does not ask:

- whether the AI or human code is objectively correct;
- whether AI can replace a second human coder;
- whether QualiAudit increases research validity;
- whether descriptive overlap is intercoder reliability;
- whether the prototype is safe for sensitive or regulated research data;
- whether a small formative sample represents all qualitative researchers.

## Study design

Use moderated, task-based sessions with a small purposive formative sample. The
final participant number, stopping rationale, recruitment route, compensation,
and inclusion/exclusion criteria must be set before recruitment with local
advisor and ethics input. Do not claim statistical representativeness or use
“saturation” as a default justification.

Seek variation relevant to the product rather than collecting unnecessary
demographics:

- primary use of Codebook / Framework Analysis, Reflexive Thematic Analysis, or
  another clearly described approach;
- doctoral, professional, or research-support experience;
- prior use of Excel and/or qualitative analysis software;
- prior experience with generative AI in research;
- relevant access needs volunteered for session accommodation.

Do not collect names, personal email addresses, employer or institution names,
participant research data, diagnoses, or other identifying details in the
observation record. Recruitment and consent records, if approved, remain
separate from session observations.

## Conditions and ordering

The synthetic reviewer is deterministic. The study does not secretly vary model
quality or present one reading as verified truth.

Where the approved sample supports both modes:

- alternate which analysis mode is encountered first;
- rotate the order of selected cases;
- analyse mode-specific sessions separately before cross-mode comparison;
- record any facilitator deviation from the assigned order.

This counterbalancing reduces simple order effects but does not turn the study
into a causal experiment.

## Materials

- Deployed or local QualiAudit synthetic demo at the frozen study version.
- [Session guide](SESSION_GUIDE.md).
- One copy of the [observation template](OBSERVATION_TEMPLATE.md) per session.
- Institution-approved participant information and consent materials.
- Approved accessibility accommodations and, if applicable, approved recording
  tools.

Record the exact QualiAudit commit, deployment URL, browser, device class, and
protocol version used. Do not paste participant identifiers or access tokens into
the repository.

## Core task sequence

1. **Orient without selling the product.** Ask the participant to describe what
   they think QualiAudit does and does not do.
2. **Inspect the fictional materials.** Ask them to identify the research
   question, method, codebook, human first-pass code, and synthetic-data label.
3. **Explain the freeze.** Before running the reviewer, ask what they believe
   becomes fixed and what the reviewer will receive.
4. **Run the local blind reviewer.** Use the no-transmission deterministic
   reviewer. Do not enable a third-party provider.
5. **Triage three contrasting cases.** Include:
   - one direct or interpretive-overlap case;
   - one divergent or alternative-reading case;
   - one context, confidence, boundary, ambiguity, or unsupported-reading case.
6. **Resolve at least one case.** Ask the participant to select a human decision
   and write a rationale using the interface.
7. **Use the method-specific audit feature.**
   - Codebook / Framework route: inspect or propose a codebook-change record.
   - Reflexive route: add a decision-linked reflexive memo.
8. **Inspect the audit.** Ask what another researcher could and could not infer
   from the decision log and privacy-minimised HTML choice.
9. **Inspect data boundaries.** Ask where state is stored, what a project file
   contains, and what deletion does not remove.
10. **Debrief.** Ask what felt influential, constraining, methodologically
    inappropriate, useful, or missing.

Participants may pause, skip a task, decline a question, or stop the session
without supplying a reason under the approved local procedure.

## Evidence to collect

Use direct observations and short participant explanations rather than inferring
internal states from clicks alone:

- task completion, assisted completion, skip, or abandonment;
- critical incidents and recovery;
- interpretation of reviewer provenance and uncertainty;
- evidence cited from excerpt, context, codebook, or analytic stance;
- decision and rationale before/after opening an AI case, where observable;
- adoption, rejection, combination, or intentional non-resolution;
- reuse of AI wording without an independent reason;
- active search for alternative readings;
- confusion between overlap, reliability, validation, and correctness;
- method-language mismatch;
- accessibility barriers and requested adaptations;
- participant refusal or critique;
- time estimates only as diagnostic context, not a productivity claim.

“Possible anchoring” and “possible automation bias” are researcher interpretations
requiring supporting observation and disconfirming evidence. They are not
diagnoses or validated psychometric measurements.

## Data handling

- Use a pseudonymous study ID generated by the approved study team.
- Store observations only in the approved institutional location.
- Keep recruitment/consent records separate from observations.
- Recording is off by default in this repository protocol. Use it only when
  separately approved and consented.
- Do not upload observation notes, recordings, transcripts, or participant
  details to GitHub, Vercel, QualiAudit, or an unapproved model provider.
- Do not use participant names or email addresses in filenames.
- Apply the locally approved retention and deletion schedule.

## Pause and escalation rules

Pause recruitment or analysis and escalate to the responsible study lead if:

- a task exposes real participant or research data;
- a participant reasonably believes the reviewer is authoritative or validated
  despite correction;
- the interface sends data unexpectedly;
- consent, recording, accessibility, or withdrawal procedures fail;
- a security or privacy incident occurs;
- a method-specific route systematically misrepresents participants’ practice.

Security concerns should follow [SECURITY.md](../../SECURITY.md), not a public
issue containing sensitive details.

## Completion criteria

The study phase is not “complete” because sessions ran. It is complete only when:

- protocol deviations and missing data are documented;
- method-specific analyses and negative cases are retained;
- product changes are traceable to evidence;
- limitations and unresolved disagreements are published;
- no claim exceeds the design or approved sample;
- the governance gate has a recorded disposition.
