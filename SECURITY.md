# Security and research-data guidance

## Supported version

QualiAudit is currently an early v0.1 research prototype. Security fixes target the latest commit on the default branch.

## Reporting a vulnerability

Until a dedicated private reporting channel is configured, do not post participant data, credentials, or an exploitable proof-of-concept in a public issue. Open a minimal issue asking maintainers for a private contact route.

## Data boundary in v0.1

The bundled demo uses fictional data and sends no excerpts to a model provider or application backend. CSV, TSV, Excel, and QualiAudit project files are parsed in the browser; imported content is not uploaded by QualiAudit. Project state is stored in browser `localStorage`. This is convenient, not secure research-data storage: other users or software with access to the same browser profile may be able to read it.

The in-app **Data & privacy** control reports whether QualiAudit has a saved review and can delete its browser-storage key after confirmation. It does not call `localStorage.clear()` and therefore does not deliberately remove unrelated site records. It also cannot remove downloaded files, device or browser backups, synced copies, screenshots, or exports stored elsewhere. Those copies must be governed and deleted separately.

Downloaded `.qualiaudit.json` files are plain-text, resumable backups rather than encrypted archives. They can contain the complete research record: source excerpts and context, human and second-coder judgments, rationales and confidence, frozen snapshots, AI reviews, and resolution history. Store, transfer, retain, and delete them under the same governance controls as the source research data. The restore flow validates structure and shows a summary, but it does not establish that the file is trustworthy or free of sensitive content.

Do not use v0.1 with sensitive, identifiable, embargoed, or regulated research material. A future real-model adapter must complete a threat model, explicit transmission consent flow, provider disclosure, secret-management review, and institutional governance guidance before being described as suitable for real research data.

Application-level encryption is not implemented. The options, risks, v0.1 decision, and prerequisites for a future encrypted format are documented in [Browser encryption feasibility](docs/ENCRYPTION_FEASIBILITY.md).

## API keys and environment variables

- Put local secrets in `.env` or another ignored `.env.*` file. Only empty placeholders belong in `.env.example`.
- Never prefix an API key with `VITE_`. Vite deliberately embeds `VITE_*` values in the client bundle, where any visitor can read them.
- A real model integration must read `OPENAI_API_KEY` from a server-side process. Browser code must call a controlled backend endpoint and must never receive the provider key.
- If a real key is ever committed, removing it from the latest file is not enough: revoke or rotate it immediately, then clean the Git history.

Run `npm run check:release` before publishing. It checks the current branch and its patch history for common secret formats, personal-email domains, local machine paths, and non-sanitised commit identity metadata.
