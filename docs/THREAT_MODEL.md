# Initial threat model for the optional real reviewer

Status: initial engineering threat model for the v0.2 prototype. It is not an institutional approval, data-protection impact assessment, penetration test, provider contract review, or claim that QualiAudit is suitable for sensitive research data.

## Scope and protected assets

This model covers the path from the browser freeze checkpoint through `api/review.ts`, the OpenAI Responses API request, validated review storage in the browser, project-file save, and audit export.

Protected assets include:

- API credentials and deployment configuration;
- excerpts, source IDs, context, and research questions;
- human codes, rationales, confidence, second-coder fields, and decisions;
- consent, prompt/schema versions, request identifiers, and audit provenance;
- provider quota, billing, and service availability.

## Trust boundaries

```text
researcher/browser
    │  explicit consent + allowlisted blind payload
    ▼
QualiAudit serverless endpoint
    │  server-only API key + second allowlist + versioned protocol
    ▼
OpenAI API
    │  structured response + provider request/response IDs
    ▼
QualiAudit validation
    │  accepted review only
    ▼
browser localStorage / downloaded project and audit files
```

The browser is not trusted to choose a model, provide credentials, or define the outbound object shape. Provider output is also untrusted until it passes schema, excerpt-ID, codebook, uncertainty, and verbatim-evidence validation.

## Threats, current controls, and residual risk

| Threat | Current controls | Residual risk / required next control |
| --- | --- | --- |
| API key disclosure | Key is read only from `OPENAI_API_KEY`; no `VITE_` secret; release scanner checks common key formats. | Deployment administrators and platform logs remain in scope. Rotate any exposed key immediately. |
| Human interpretation leakage | Browser builds a blind payload; server reconstructs a second exact-field allowlist; tests inject and discard human fields. | Excerpt text or context can itself contain identifying information. Consent does not de-identify data. |
| Silent or accidental transmission | Local reviewer is default; deployment, key, model, disclosure, and versioned consent are all required. | A user can still consent to inappropriate data. Institutional review remains necessary. |
| Public endpoint abuse and unexpected spend | Request count/size limits; explicit deployment enable flag; provider quota can reject excess traffic. | There is no account system or durable application-level rate limit. Use platform access controls, provider project budgets/limits, and monitoring before enabling a billable public endpoint. |
| Cross-origin or scripted direct calls | POST requires JSON with a current consent record and passes strict validation. | Consent records are not authentication. A script can construct one. Network/perimeter controls are required for restricted deployments. |
| Timeout, replay, and duplicate cost | Server and browser timeouts; unique client request ID; no automatic retry; interrupted outcome is disclosed. | A manually retried request can duplicate provider work. Durable idempotency would require trusted server storage. |
| Provider throttling or outage | Safe error classes, bounded `Retry-After`, local fallback, and human-initiated retry. Raw provider error bodies are not returned. | Availability remains dependent on the provider and deployment. |
| Invalid, unsupported, or manipulative model output | Strict structured output plus post-response codebook, ID, uncertainty, and verbatim-evidence checks. AI has no final decision authority. | Valid-looking output can still be analytically poor or biased. Human review and empirical evaluation remain necessary. |
| Prompt/schema drift | Named registry entry; model, adapter, prompt version, schema version, timestamps, and request IDs are exported. | Exact reproducibility also depends on pinned model snapshots and provider behavior. Deployment owners must choose and document a model deliberately. |
| Provider retention or training misunderstanding | UI discloses `store=false`, default abuse-monitoring retention, and links current provider data controls. | Provider account controls and contracts may differ. Verify the actual organisation/project configuration. |
| Local record or download exposure | Browser-data dialog, explicit deletion, portable-file warnings, no claim of encryption. | `localStorage`, project JSON, audit JSON, CSV, screenshots, browser sync, and backups can expose data. Govern them like source data. |
| Log leakage | Application code does not log payloads, provider bodies, or keys; support references use request IDs. | Hosting/provider infrastructure may keep logs outside QualiAudit’s control. Review platform logging and redaction settings. |

## Deployment gate

Before enabling `QUALIAUDIT_ENABLE_REMOTE_REVIEW=true`:

1. use a dedicated provider project and least-privilege server-side key;
2. set an explicit model and truthful region/retention disclosure;
3. configure platform access protection for any non-public research deployment;
4. configure provider spend limits, rate limits, alerts, and key rotation;
5. inspect hosting and provider log/retention settings;
6. complete the relevant institutional, ethics, privacy, and contractual review;
7. test only with synthetic data first;
8. confirm the local reviewer still works when the provider is unavailable.

Until those controls are completed for a deployment, keep the real reviewer disabled and use fictional or appropriately governed data only.
