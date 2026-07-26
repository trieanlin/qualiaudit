# Issue-ready development backlog

These are the first scoped issues to create when the repository receives a GitHub remote. They are intentionally kept as user-visible outcomes rather than implementation fragments.

## QA-01 — Import Excel workbooks with explicit sheet and column mapping

**Phase:** Trustworthy import  
**Status:** Complete
**Outcome:** A researcher can select a `.xlsx` file, choose a codebook/coded-excerpt sheet, map columns, preview rows, and see validation before replacing the current material.  
**Acceptance:** No silent coercion; formulas are read as displayed values; no workbook content leaves the browser; fixtures cover multiple sheets, blank cells, Unicode, and multi-code delimiters.

## QA-02 — Export and restore a portable local project file

**Phase:** Trustworthy import  
**Status:** Complete
**Outcome:** A review can be backed up and restored without an account or cloud database.  
**Acceptance:** The format is versioned; restores show a summary before changing state; corrupted or future-version files fail safely; deletion of browser state is explicit.

## QA-03 — Add a server-side reviewer adapter with transmission consent

**Phase:** Optional real reviewer  
**Status:** Complete
**Outcome:** A researcher can opt into a real model only after seeing the provider and exact outbound fields.  
**Acceptance:** Keys are server-side; cancelled consent sends nothing; mock fallback remains available; model/prompt/schema versions and provider disclosure appear in exports; human fields remain absent from the payload.

## QA-04 — Validate and recover structured reviewer responses

**Phase:** Optional real reviewer  
**Status:** Complete
**Outcome:** Invalid codes, missing evidence, malformed uncertainty, and provider failures become transparent review states rather than fabricated success.  
**Acceptance:** Schema errors are visible; retry is user-controlled; invalid suggestions are classified in the queue; the original provider response is not exposed if it may contain sensitive content.

## QA-05 — Create a versioned codebook-change ledger

**Phase:** Richer audit practice  
**Status:** Complete
**Outcome:** “Revise codebook” decisions can record before/after definitions and identify affected excerpts.  
**Acceptance:** Changes never rewrite the frozen snapshot; the audit shows author, rationale, timestamp, affected codes, and unresolved recoding work.

## QA-06 — Generate a printable HTML audit report

**Phase:** Richer audit practice  
**Status:** Complete
**Outcome:** A researcher can create a self-contained report with provenance, methods statement, decision log, unresolved cases, and evidence excerpts.  
**Acceptance:** Print styles are readable; real-model provider fields are included when present; quoted data can be omitted or redacted; the report states limitations.

## QA-07 — Conduct formative usability and automation-bias research

**Phase:** Research and evaluation  
**Outcome:** Product decisions are informed by observed use with qualitative researchers rather than assumed trust or productivity gains.  
**Acceptance:** Study materials distinguish methods; evaluation considers anchoring, rationale quality, interpretive diversity, and refusal/rejection behaviour; negative findings are documented.

## QA-08 — Accessibility audit of the complete review workflow

**Phase:** Cross-cutting quality  
**Status:** Engineering pass complete; assistive-technology matrix pending
**Outcome:** The sample flow meets WCAG 2.2 AA expectations for keyboard, focus, semantics, contrast, zoom, and reduced motion.  
**Acceptance:** Automated checks are supplemented by keyboard and screen-reader testing; issues are tracked per screen; no status relies on colour alone.

## QA-09 — Make local review retention inspectable and deletable

**Phase:** Trustworthy import
**Status:** Complete
**Outcome:** A researcher can see what QualiAudit retains in the browser and remove the working record without affecting unrelated browser data.
**Acceptance:** The summary avoids displaying excerpt text; deletion requires confirmation; QualiAudit removes only its versioned key; downloaded-file boundaries and the absence of application-level encryption are explicit and tested.

## QA-10 — Expand the synthetic import validation corpus

**Phase:** Trustworthy import
**Status:** Complete
**Outcome:** Researchers receive explicit feedback when common delimited-text structures or coding shapes cannot be represented safely.
**Acceptance:** Comma, semicolon, tab, UTF-8 BOM, multiline quotes, Unicode identifiers, malformed row widths, duplicate headers, multi-code primary cells, and overlapping segment boundaries have fictional regression fixtures; structural failure never replaces the current material.

## QA-11 — Add transparent research-tool import profiles

**Phase:** Trustworthy import
**Status:** Complete
**Outcome:** A researcher importing a selected NVivo, MAXQDA, or ATLAS.ti tabular `.xlsx` export receives a visible, editable column-mapping suggestion without a claim of native integration.
**Acceptance:** Detection uses several column-label signals; ambiguous or missing fields fall back to human mapping; profile selection never bypasses validation; native project files remain unsupported; a fully fictional multi-sheet workbook tests the recognised shapes and metadata-sheet boundary.

## QA-12 — Add decision-linked researcher reflexive memos

**Phase:** Richer audit practice
**Status:** Complete
**Outcome:** After recording a human decision, a researcher can append a reflection about what the comparison made visible, complicated, or left unresolved.
**Acceptance:** Each memo records author and timestamp plus the excerpt and decision snapshot it followed; saved memos are append-only; project files and JSON/HTML audits preserve them; local-data and restore summaries disclose them; neither browser nor server reviewer payloads include them.

## QA-13 — Keep optional second-human comparison separate from AI review

**Phase:** Richer audit practice
**Status:** Complete
**Outcome:** A researcher can inspect optional second-human coding without combining it with the independent AI review or implying that AI replaced a human coder.
**Acceptance:** Second-human codes and rationales remain frozen and withheld from the reviewer; queue, case, audit, CSV, JSON, and HTML outputs preserve an explicit analytical boundary; method-sensitive labels avoid error language in reflexive mode; optional-subset counts do not produce an intercoder-reliability coefficient.
