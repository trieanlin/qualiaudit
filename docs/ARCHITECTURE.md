# Architecture and safeguard notes

## Current shape

QualiAudit’s default workflow is a static React application. `App.tsx` owns the workflow state; focused screen components render project setup, materials, freeze checkpoint, review progress, queue, case resolution, and audit summary. `useReviewState` persists that state locally. The optional real reviewer is isolated in one serverless endpoint; imports, project files, human comparison, resolution, and audit interaction remain client-side.

The domain layer remains UI-independent:

- `validation.ts` performs declared rule checks.
- `csv.ts` detects and strictly parses comma, semicolon, or tab-delimited text before state replacement.
- `spreadsheet.ts` reads workbook sheets and applies explicit field mappings.
- `importProfiles.ts` recognises conservative column-label patterns and supplies optional vendor-specific mapping aliases.
- `reviewer.ts` creates a narrow blind payload and runs the deterministic reviewer.
- `remoteReviewer.ts` is the browser client for explicit provider configuration and review requests.
- `reviewerProtocol.ts` versions consent, prompt/adapter identity, and shared request metadata.
- `api/review.ts` re-allowlists the blind payload, keeps credentials server-side, calls the provider, and validates structured output before returning it.
- `queue.ts` compares the already-independent reading with the frozen human record.
- `export.ts` constructs reviewed rows and the non-resumable audit bundle.
- `projectFile.ts` serialises and validates a versioned, resumable copy of `ReviewState`.
- `localData.ts` produces a content-minimised summary of the retained browser record for the privacy control.

## Information flow

```text
Human-coded CSV ──► validation ──► frozen snapshot
                                         │
                                         ├──► retained for later comparison
                                         │
                                         └──► blind payload builder
                                                     │
                                                     ▼
                                     local mock or consented server adapter
                                                     │
                     frozen human record ────────────┤
                                                     ▼
                                            comparison queue
                                                     │
                                                     ▼
                                      human resolution + audit export
                                                     │
                                                     ▼
                                      local project save / restore
```

Human fields do not flow through the blind-payload branch. Comparison occurs only after the reviewer result exists.

Project files intentionally sit outside the reviewer boundary: they preserve the complete application state for the human researcher and therefore include fields withheld from AI. Import validation rejects malformed structure, unsupported schema versions, duplicate record IDs, resolutions without reviews, and reviews that are not backed by the frozen excerpt set. Restores never transmit the file and never treat audit JSON as a resumable project.

The local-data control reads the already-loaded `ReviewState`, reports counts rather than excerpt content, and removes only the versioned QualiAudit storage key. Returning to an empty landing state does not recreate an empty storage record. Downloaded files are outside the browser-storage lifecycle and are never represented as deleted by this action. Application-managed encryption is deliberately deferred; see [Browser encryption feasibility](ENCRYPTION_FEASIBILITY.md).

Delimited-text parsing is intentionally fail-closed for structural uncertainty: duplicated headers, unclosed quotes, inconsistent row widths, oversized files, and row-limit violations leave the existing review material unchanged. Validation then applies domain rules after parsing. Unicode-normalized identifiers expose visually equivalent duplicate codes without rewriting them; multi-code primary cells block freezing because the current domain model records one primary human code; excerpt overlap is a warning for human segment-boundary review rather than an automatic edit.

Spreadsheet profiles sit before domain validation and alter suggestions only. Detection requires
several matching column labels, ambiguous matches fall back to manual mapping, and missing required
fields remain unresolved. The application does not inspect vendor project payloads, infer codes from
sheet names, or represent a profile match as verified compatibility. See
[Research-tool import profiles](IMPORT_PROFILES.md).

## Optional real reviewer

The initial OpenAI adapter sits behind `api/review.ts` and implements the same narrow payload/result contracts. The frontend first discloses what leaves the device, the provider, configured model, region label, and retention warning. Transmission requires versioned consent. The server then reconstructs an allowlisted payload rather than trusting client object shape.

Provider credentials and activation stay in non-`VITE_` server environment variables. The Responses API request uses `store=false` and a strict schema. QualiAudit additionally checks code membership, one-to-one excerpt IDs, uncertainty values, and verbatim evidence before saving reviews. Provider/model/prompt/destination/consent metadata flow into audit exports.

The local deterministic adapter remains the default fallback so the public demo never requires a key or participant data. The remote endpoint is inactive unless an explicit deployment flag, key, and model are all present. This is a foundation rather than a completed threat model; public billable deployment still needs platform-level access, rate, and spend controls. See [Optional real reviewer](REMOTE_REVIEWER.md).
