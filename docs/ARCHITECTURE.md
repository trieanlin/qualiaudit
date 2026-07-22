# Architecture and safeguard notes

## Current shape

QualiAudit v0.1 is a static React application. `App.tsx` owns the workflow state; focused screen components render project setup, materials, freeze checkpoint, review progress, queue, case resolution, and audit summary. `useReviewState` persists that state locally.

The domain layer remains UI-independent:

- `validation.ts` performs declared rule checks.
- `reviewer.ts` creates a narrow blind payload and runs the deterministic reviewer.
- `queue.ts` compares the already-independent reading with the frozen human record.
- `export.ts` constructs portable reviewed rows and the full audit bundle.

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
```

Human fields do not flow through the blind-payload branch. Comparison occurs only after the reviewer result exists.

## Adding a real reviewer

A real provider must sit behind a server-side endpoint and implement the same narrow payload/result contracts. The frontend must first disclose what leaves the device, the provider, and the relevant retention terms. Secrets must remain server-side. Schema validation, provider errors, prompt/model versions, and data-governance metadata must all be exported.

The local deterministic adapter remains the default fallback so the public demo never requires a key or participant data.
