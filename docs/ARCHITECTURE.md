# Architecture and safeguard notes

## Current shape

QualiAudit v0.1 is a static React application. `App.tsx` owns the workflow state; focused screen components render project setup, materials, freeze checkpoint, review progress, queue, case resolution, and audit summary. `useReviewState` persists that state locally.

The domain layer remains UI-independent:

- `validation.ts` performs declared rule checks.
- `reviewer.ts` creates a narrow blind payload and runs the deterministic reviewer.
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
                                              mock AI review
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

## Adding a real reviewer

A real provider must sit behind a server-side endpoint and implement the same narrow payload/result contracts. The frontend must first disclose what leaves the device, the provider, and the relevant retention terms. Secrets must remain server-side. Schema validation, provider errors, prompt/model versions, and data-governance metadata must all be exported.

The local deterministic adapter remains the default fallback so the public demo never requires a key or participant data.
