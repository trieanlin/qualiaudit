# Formative evaluation kit

## Status and boundary

This directory contains a **study-ready draft**, not a completed study, an approved
ethics protocol, or evidence that QualiAudit is effective. It is intended to make a
future formative evaluation inspectable before recruitment begins.

The current kit:

- uses only the clearly labelled fictional QualiAudit synthetic demo;
- does not ask participants to upload real research material;
- does not treat an AI reading as ground truth;
- keeps Codebook / Framework Analysis and Reflexive Thematic Analysis findings
  analytically distinct;
- treats changes after AI exposure as observations to interpret, not as improvement;
- requires local ethics, privacy, accessibility, and data-governance review before
  recruitment;
- includes a place to record friction, refusal, null results, and negative findings.

Do not recruit participants or collect data from this draft until the
[governance gate](GOVERNANCE_GATE.md) has been completed by the responsible study
team. This repository does not provide an institution-approved participant
information sheet or consent form.

## Contents

- [Formative study protocol](FORMATIVE_STUDY_PROTOCOL.md) — questions, scope,
  sampling logic, tasks, evidence, and study boundaries.
- [Session guide](SESSION_GUIDE.md) — neutral facilitation prompts and a
  method-sensitive walkthrough.
- [Observation template](OBSERVATION_TEMPLATE.md) — a privacy-minimised record for
  one session.
- [Analysis plan](ANALYSIS_PLAN.md) — within-case and cross-case interpretation,
  negative-case handling, and reporting limits.
- [Governance gate](GOVERNANCE_GATE.md) — prerequisites that must be resolved
  locally before recruitment.
- [Internal protocol dry-run — 2026-07-26](INTERNAL_DRY_RUN_2026-07-26.md) —
  a synthetic, non-participant rehearsal record; it is not study evidence.

## Intended use

1. Review the protocol with qualitative-methods, human–AI interaction,
   accessibility, and institutional-governance advisors.
2. Adapt the materials to the approved local study and participant population.
3. Dry-run the synthetic tasks with the study team; mark the record `DRY-RUN`,
   not `PARTICIPANT`.
4. Freeze the approved protocol version before recruitment.
5. Conduct sessions using institution-approved information and consent materials.
6. Analyse Codebook / Framework and Reflexive Mode sessions separately before
   considering shared patterns.
7. Publish limitations and negative findings alongside any resulting product
   change.

The app has no study telemetry. Observation records are created outside
QualiAudit and must be stored only in the approved research location.

## Why this design

Research on AI-assisted decisions shows that interface interventions can reduce
overreliance while also introducing effort and acceptability trade-offs. It also
shows that people’s beliefs about whether advice comes from AI can influence
whether they use it. These findings motivate observation of reasoning and
friction, but they do not establish that the same effects occur in qualitative
coding.

Qualitative coding also lacks a universal ground-truth answer. In particular,
reflexive thematic analysis treats researcher subjectivity and reflexivity as
analytic resources and should not inherit coding-reliability criteria from a
different form of thematic analysis. The kit therefore does not calculate
“appropriate reliance”, accuracy, or Cohen’s kappa for human–AI comparisons.

## Methodological sources

- Braun, V., & Clarke, V. (2019). [Reflecting on reflexive thematic
  analysis](https://doi.org/10.1080/2159676X.2019.1628806).
- Braun, V., & Clarke, V. (2021). [One size fits all? What counts as quality
  practice in (reflexive) thematic
  analysis?](https://doi.org/10.1080/14780887.2020.1769238).
- Braun, V., & Clarke, V. (2023). [Toward good practice in thematic analysis:
  Avoiding common problems and be(com)ing a knowing
  researcher](https://doi.org/10.1080/26895269.2022.2129597).
- Buçinca, Z., Malaya, M. B., & Gajos, K. Z. (2021). [To Trust or to Think:
  Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted
  Decision-making](https://doi.org/10.1145/3449287).
- Vodrahalli, K., Daneshjou, R., Gerstenberg, T., & Zou, J. (2022). [Do humans
  trust advice more if it comes from AI? An analysis of human–AI
  interactions](https://doi.org/10.1145/3514094.3534150).
- Schemmer, M., Hemmer, P., Kühl, N., Benz, C., & Satzger, G. (2022).
  [Should I Follow AI-based Advice? Measuring Appropriate Reliance in Human-AI
  Decision-Making](https://arxiv.org/abs/2204.06916). This
  ground-truth-oriented framework is included as a contrast; its correctness
  categories are not transferred to interpretive qualitative coding.

These sources inform the questions and safeguards. They are not evidence that
QualiAudit has already reduced anchoring or automation bias.
