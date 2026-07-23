# Security and research-data guidance

## Supported version

QualiAudit is currently an early v0.1 research prototype. Security fixes target the latest commit on the default branch.

## Reporting a vulnerability

Until a dedicated private reporting channel is configured, do not post participant data, credentials, or an exploitable proof-of-concept in a public issue. Open a minimal issue asking maintainers for a private contact route.

## Data boundary in v0.1

The bundled demo uses fictional data and sends no excerpts to a model provider or application backend. Project state is stored in browser `localStorage`. This is convenient, not secure research-data storage: other users or software with access to the same browser profile may be able to read it.

Do not use v0.1 with sensitive, identifiable, embargoed, or regulated research material. A future real-model adapter must complete a threat model, explicit transmission consent flow, provider disclosure, secret-management review, and institutional governance guidance before being described as suitable for real research data.

## API keys and environment variables

- Put local secrets in `.env` or another ignored `.env.*` file. Only empty placeholders belong in `.env.example`.
- Never prefix an API key with `VITE_`. Vite deliberately embeds `VITE_*` values in the client bundle, where any visitor can read them.
- A real model integration must read `OPENAI_API_KEY` from a server-side process. Browser code must call a controlled backend endpoint and must never receive the provider key.
- If a real key is ever committed, removing it from the latest file is not enough: revoke or rotate it immediately, then clean the Git history.

Run `npm run check:release` before publishing. It checks the current branch and its patch history for common secret formats, personal-email domains, local machine paths, and non-sanitised commit identity metadata.
