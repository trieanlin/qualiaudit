# Optional real reviewer: security and consent boundary

QualiAudit’s local deterministic reviewer remains the default. The optional OpenAI adapter exists to make a real-model review possible without moving an API key into browser code or silently changing the data boundary.

This is an early v0.2 foundation, not a claim that the app is suitable for identifiable, sensitive, regulated, or otherwise governed research data.

## What happens before transmission

The freeze screen requires the researcher to choose the OpenAI reviewer explicitly. It then shows:

- provider: OpenAI API;
- configured model, or that no model is configured;
- a deployment-supplied region label, or that the region is unspecified;
- the retention warning;
- `store=false` response-storage request;
- fields that can be sent and human interpretation fields that remain withheld.

The remote action stays disabled until the deployment reports `QUALIAUDIT_ENABLE_REMOTE_REVIEW=true`, `OPENAI_API_KEY`, and `OPENAI_MODEL`, and the researcher records explicit versioned consent. If configuration cannot be checked, no excerpt data is sent.

OpenAI documents that API keys must not be shipped in browsers and should be kept in a backend environment variable. OpenAI also states that API data is not used for model training by default, while default abuse-monitoring logs may retain customer content for up to 30 days unless approved controls apply. Consult the current [API key safety guidance](https://help.openai.com/en/articles/5112595-best-practices-for-api-key) and [platform data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint) rather than treating the in-app summary as a contractual guarantee.

## Double blind-review enforcement

The browser constructs the existing blind payload from the frozen record. The server does not trust that payload directly: `api/review.ts` rebuilds it using an allowlist before any provider call.

Allowed:

- research question;
- analysis mode;
- intended AI role;
- codebook code, definition, inclusion/exclusion guidance, and optional example;
- excerpt ID, source ID, excerpt text, and optional necessary context.

Discarded even if submitted as extra properties:

- human code, rationale, and confidence;
- second-coder code and rationale;
- resolutions, final decisions, change-after-exposure flags, and researcher-authored reflexive memos;
- browser-supplied provider credentials or model overrides.

The server rejects missing/old consent versions, duplicate excerpt IDs, duplicate code IDs, over-sized requests, unsupported analysis modes, and requests above 50 excerpts or 120 KB of allowlisted JSON.

## Versioned protocol and reproducibility

`reviewerRegistry.ts` is the single registry for the active reviewer prompt and output-schema identity. A registry entry contains the adapter ID, prompt version, schema version, response-format name, and exact instructions. Changing those instructions or the output contract requires a new named entry rather than silently rewriting the meaning of an existing version.

Accepted reviews record:

- configured model;
- reviewer adapter, prompt, and schema versions;
- consent version and data destination;
- analysis timestamp;
- QualiAudit client request ID;
- provider request and response IDs when returned.

These fields support audit and troubleshooting. They do not make stochastic model output perfectly reproducible. Deployment owners should deliberately choose and document a model, and use a pinned model snapshot when their provider access and evaluation plan support it.

## Provider-output validation

The server requests a strict JSON Schema response through the Responses API with `store=false`. Before saving a result, it checks:

- exactly one result per submitted excerpt ID;
- no duplicate or unknown excerpt IDs;
- primary and alternative codes belong to the submitted codebook;
- uncertainty and context flags use the expected values;
- each evidence quote is a verbatim substring of its excerpt.

Invalid provider output fails closed. It is not silently converted into a valid-looking review.

## Operational failure behaviour

The server timeout defaults to 45 seconds and can be configured with `QUALIAUDIT_REVIEW_TIMEOUT_MS`; values are clamped to 10–120 seconds. The browser also has a longer safety timeout so a broken connection does not wait indefinitely.

QualiAudit distinguishes provider throttling, credential/project access errors, provider unavailability, server timeout, endpoint/network failure, and invalid structured output. It returns only safe application messages and support request IDs, never the raw provider error body. A valid `Retry-After` value is bounded to one hour and shown as a disabled retry countdown.

There is no automatic retry. A timeout can have an unknown provider-side outcome, so resending research text and potentially incurring duplicate cost always requires a new human action. The local deterministic reviewer remains available.

## Configuration

Local secrets belong in an ignored `.env` file:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
QUALIAUDIT_ENABLE_REMOTE_REVIEW=false
QUALIAUDIT_OPENAI_REGION=
QUALIAUDIT_REVIEW_TIMEOUT_MS=45000
```

`OPENAI_MODEL` is deliberately required rather than silently defaulted, so the recorded audit provenance matches an explicit deployment choice. `QUALIAUDIT_OPENAI_REGION` is only a human-readable disclosure label; actual processing location follows the provider account and deployment configuration.

Vite alone serves the browser application but not the serverless function. Use Vercel’s local development environment when testing the optional endpoint, or keep using `npm run dev` for the no-transmission mock workflow.

In Vercel, add `OPENAI_API_KEY` as a secret environment variable and set `OPENAI_MODEL` and the truthful region label in project settings. Set `QUALIAUDIT_ENABLE_REMOTE_REVIEW=true` only after reviewing access and spend controls for that deployment. Never use a `VITE_` prefix for any provider key.

## Known limitations

- There is not yet an institution-specific governance workflow, data-processing agreement checker, budget dashboard, or automated provider-region verification.
- The current endpoint does not provide user accounts or durable per-user rate limiting. Do not enable a billable key on an unrestricted public deployment without suitable platform-level access, rate, and spend controls.
- A consent screen does not make data appropriate for transmission.
- The current retry is human initiated. An interrupted request can have an unknown provider-side outcome, so QualiAudit does not silently retry it.
- The endpoint currently handles at most 50 excerpts per request. Larger reviews need a reviewed batching design that preserves provenance and cost controls.
- The public synthetic demo should continue using the local mock reviewer unless the maintainer intentionally configures the optional provider.

See the [initial threat model and deployment gate](THREAT_MODEL.md) for assets, trust boundaries, current controls, residual risks, and prerequisites for enabling a billable deployment.
