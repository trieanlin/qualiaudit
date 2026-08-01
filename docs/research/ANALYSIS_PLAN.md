# Formative analysis plan

## Analytic stance

This is an interpretive, formative analysis of interaction with a research
prototype. It combines task evidence with method-aware qualitative interpretation.
It does not use an AI reading as ground truth, score participants for compliance,
or infer a psychological trait from one click.

Freeze the protocol, study version, planned mode split, and initial analytic
framework before the first participant session. Record later changes rather than
silently replacing them.

## Units of analysis

Keep three linked units:

1. **Critical incident** — a specific action, hesitation, explanation, error,
   recovery, refusal, or accessibility barrier.
2. **Case encounter** — one participant’s reasoning before, during, and after
   inspecting one AI reading.
3. **Session** — the participant’s broader model of the workflow, method fit,
   data boundary, and audit.

Do not turn every click into an independent observation. Preserve sequence and
context.

## Descriptive task summary

For each task, report counts of:

- completed without help;
- completed with recorded help level;
- skipped or abandoned;
- critical incident;
- method-language mismatch;
- accessibility barrier.

Approximate time may locate friction. Do not present it as productivity,
efficiency, or superiority without a design capable of supporting that claim.

## Initial interpretive framework

Apply the following sensitising concepts, while allowing inductive findings:

### Interpretive agency

- Participant supplies an independent reading or reason.
- Participant preserves, combines, revises, rejects, discusses, or leaves a
  reading unresolved.
- Participant feels able or unable to resist interface defaults.

### Evidence practice

- Excerpt, context, codebook, uncertainty, or analytic stance is consulted.
- Evidence conflicts are noticed.
- Missing context is sought or ignored.
- AI wording is reused with or without independent support.

### Possible anchoring or reliance pattern

- Attention narrows around the first visible AI label.
- Alternatives present before exposure disappear without an articulated reason.
- AI provenance is treated as evidence of correctness.
- Advice is rejected solely because it is AI.
- Friction prompts deliberate evaluation or merely creates burden.

These are possible interpretations, not diagnostic labels. Each claim must retain
the observable sequence, participant explanation, observer confidence, and at
least one credible alternative explanation.

### Method coherence

- Codebook / Framework participants can discuss application consistency and
  ambiguity without turning human–AI overlap into validation.
- Reflexive participants can treat divergence as an alternative reading and use
  reflexive memos without being pushed toward consensus or reliability language.
- The interface conflicts with, flattens, or mislabels the participant’s stated
  approach.

### Audit and governance comprehension

- Blind-review boundary is understood.
- Reviewer uncertainty and provenance are interpreted cautiously.
- Local storage, exported-project sensitivity, deletion limits, and report
  minimisation are understood.
- Auditability is confused with correctness, security, or ethics approval.

## Method-specific separation

Analyse Codebook / Framework and Reflexive sessions separately first:

- create a within-mode incident table;
- describe mode-specific expectations and contradictions;
- test product language against the method participants say they use;
- retain divergent accounts within each mode.

Only then consider cross-mode patterns such as navigation, data-boundary
comprehension, or visual hierarchy. Do not calculate Cohen’s kappa or a
human–AI “accuracy” score in Reflexive Mode. Human–AI descriptive overlap is not
intercoder reliability in either mode.

## Negative-case procedure

Maintain a negative-findings ledger from the first dry run. For every emerging
claim, actively look for:

- a session where the expected pattern did not occur;
- an observation with a plausible non-AI explanation;
- a participant who refused the intended workflow;
- a feature that added effort without reflective value;
- a method or access need poorly represented by the sample;
- a finding that argues for removal or non-development.

Do not delete a negative case because it is rare. Record how it changes the
claim’s scope.

## Researcher reflexivity

Before cross-case analysis, each analyst records:

- relationship to QualiAudit and investment in its success;
- qualitative-method commitments;
- prior beliefs about AI-assisted analysis;
- role in facilitation or product development;
- assumptions that could shape interpretation.

Product-team interpretations should be challenged by a methods advisor or other
approved reviewer who was not responsible for the feature under discussion where
feasible. Disagreement may remain in the report.

## Product decision matrix

Use a separate [evidence-linked product decision record](PRODUCT_DECISION_TEMPLATE.md)
for each candidate change. Store completed records with the approved study data,
not in the public repository.

For each candidate change, record:

- problem statement;
- linked study IDs and critical incidents;
- mode(s) affected;
- negative/disconfirming evidence;
- privacy, accessibility, and methodological effects;
- proposed change;
- reason to defer or reject the change;
- decision owner and date;
- follow-up evidence needed.

Suggested decision categories:

- change now for a clear safety/accessibility failure;
- prototype and re-evaluate;
- document a limitation;
- retain competing designs;
- no change because evidence is weak or method-specific;
- stop or narrow the feature.

Participant preference alone does not automatically determine a product change,
and product-team preference does not override a safety or method-coherence issue.

## Reporting

Report:

- study and QualiAudit versions;
- recruitment, inclusion, compensation, and governance context;
- participant-method distribution without unnecessary identifying detail;
- task and analysis procedure;
- facilitator deviations and missing data;
- method-specific findings before shared patterns;
- negative, null, and contradictory findings;
- accessibility and data-boundary failures;
- changes made, changes deferred, and features narrowed or removed;
- limits on transferability and causal inference.

Do not report:

- “AI improved coding accuracy”;
- “QualiAudit validated the analysis”;
- “participants trusted AI appropriately” without a defensible task-specific
  operationalisation;
- “no bias was found” from absence of an observed incident;
- a WCAG, privacy, ethics, or institutional-approval claim not independently
  established.
