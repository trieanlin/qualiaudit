# QualiAudit

> A method-aware, tool-agnostic review layer for qualitative coding.

QualiAudit helps qualitative researchers independently review coded excerpts, examine human–AI disagreements without treating AI as ground truth, and document what changed, why, and how AI influenced the analysis.

It is closer to a pull request for qualitative analysis than an automated coding product: a researcher commits a first-pass interpretation, a reviewer produces a blind independent reading, and the researcher resolves or intentionally preserves the differences.

## Live demo

[Open the QualiAudit synthetic demo](https://qualiaudit-beta.vercel.app)

The demo uses fictional data, runs entirely in the browser, and does not require an account or API key.

![QualiAudit review queue](docs/screenshots/review-queue.jpg)

## Why this project exists

Researchers already doing qualitative coding in Excel, NVivo, MAXQDA, or ATLAS.ti may want a structured way to question code application, examine conceptual overlap, or disclose the influence of AI. Most AI coding interfaces optimise throughput or present model output as an answer. QualiAudit instead optimises for interpretive visibility:

- the human interpretation exists first;
- the AI reviewer cannot see human codes or rationales;
- disagreement is organised for human attention, not converted into an accuracy claim;
- the human keeps final interpretive authority;
- post-exposure changes and rationales remain auditable.

The initial audience is qualitative researchers and doctoral researchers working with interviews or open-ended text who understand their method but may not program.

## Current vertical slice

The browser-only demo supports a complete synthetic workflow. The default branch contains the v0.1 release; the current roadmap adds trustworthy spreadsheet import without changing the blind-review boundary.

1. Open a clearly labelled fictional home sleep-monitoring project.
2. Inspect or locally import a CSV/Excel codebook and human first-pass coding.
3. Validate required fields, duplicate codes, missing definitions, and missing inclusion/exclusion guidance.
4. Freeze a time-stamped snapshot of the human interpretation.
5. Run a local deterministic reviewer on a blind payload.
6. Prioritise divergence, ambiguity, missing context, segment boundaries, and confidence cases.
7. Record one of nine human resolution decisions with a required rationale.
8. Inspect the decision log and reviewer provenance.
9. Export a reviewed coding table as CSV or a fuller audit bundle as JSON.

State is saved in browser `localStorage`. No account, API key, server, or third-party model is used by the sample.

## Method-aware behaviour

QualiAudit supports two framings in the project brief.

### Codebook / Framework Analysis

The queue can show descriptive code overlap, related readings, codebook ambiguity, and consistency-relevant information. It explicitly distinguishes comparison with an AI reading from intercoder reliability and does not calculate Cohen’s kappa for the mock AI review.

### Reflexive Thematic Analysis

The interface switches to language such as *interpretive overlap*, *related readings*, and *alternative reading*. It avoids accuracy and correct/incorrect claims, omits kappa, and presents divergence as material for reflexivity and potentially productive disagreement.

Changing the method in **Project brief** updates the queue framing, comparison labels, audit statement, and methodological notes.

## The blind-review boundary

`buildBlindReviewPayload()` is the only path from the frozen project record to the reviewer. It allows:

- research question;
- analysis mode and intended AI role;
- codebook definitions;
- excerpt ID, source ID, text, and necessary context.

It excludes:

- `human_code` and `human_rationale`;
- human confidence;
- all second-coder fields;
- later resolutions and final conclusions.

An automated test asserts that these human interpretation fields are absent from the serialised payload. The exported audit bundle also records the boundary.

## Run locally

Requirements: Node.js 20 or newer and npm 10 or newer.

```bash
git clone <your-fork-or-repository-url>
cd qualiaudit
npm ci
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

No environment variable is needed for the deterministic reviewer. `.env.example` reserves future server-side model configuration without putting a key in frontend code.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check:release

# or all checks in sequence
npm run check
```

The test suite covers validation, blind payload construction, deterministic review structure, method-aware queue labels, comparison categories, spreadsheet mapping, the downloadable workbook fixture, and CSV/JSON audit data.

## Data and templates

The bundled files under [`public/samples`](public/samples) are fictional and contain no real participant data:

- [`synthetic-codebook.csv`](public/samples/synthetic-codebook.csv)
- [`synthetic-coded-excerpts.csv`](public/samples/synthetic-coded-excerpts.csv)
- [`synthetic-qualiaudit-import.xlsx`](public/samples/synthetic-qualiaudit-import.xlsx)
- blank-shape codebook and coded-excerpt templates

CSV and Excel (`.xlsx`) upload are implemented for codebooks and human-coded excerpts. Excel import includes worksheet selection, header-row detection, explicit column mapping, and a source preview before replacement. Workbook parsing happens in the browser and the demo supports up to 10 MB or 5,000 rows per selected sheet.

Direct export profiles for qualitative research tools remain roadmap items. QualiAudit does not parse proprietary project files.

## Technology choices

- **React + TypeScript** keep the stateful review flow explicit and typed while remaining familiar to open-source contributors.
- **Vite** provides a fast, small, reproducible frontend build without prescribing a backend.
- **Plain CSS** keeps the visual system inspectable and avoids locking an early research product into a component framework.
- **Vitest + Testing Library** support fast unit and interaction-oriented testing in the same TypeScript toolchain.
- **read-excel-file** provides a narrowly scoped, browser-compatible `.xlsx` parser without introducing a server or exposing imported files to a third party.
- **Local-first browser state** is appropriate for a synthetic no-login demo and makes the data boundary easy to inspect. It is not presented as secure storage for sensitive studies.

The dependency lockfile is committed; use `npm ci` for reproducible installation.

## What QualiAudit is not

v0.1 does not:

- generate final themes or perform full-text autonomous analysis;
- replace a second human coder or validate that research findings are correct;
- parse native NVivo, MAXQDA, or ATLAS.ti project files;
- transcribe audio or video;
- provide multi-user collaboration, accounts, payments, or a research-data cloud;
- send the public synthetic demo to a model provider.

## Important limitations

- The deterministic reviewer uses transparent keyword-oriented rules. Its readings demonstrate the review workflow, not model quality.
- Browser `localStorage` is not suitable for sensitive or regulated research data. Use only fictional or appropriately governed material in v0.1.
- CSV parsing covers common quoted CSV but does not yet perform complete dialect detection. Excel import is intentionally limited to `.xlsx`, 10 MB, and 5,000 rows per selected sheet; formulas are imported as their stored values and encrypted workbooks are unsupported.
- Human decisions after AI exposure may be influenced by automation bias even when the review is blind. QualiAudit records changes; it cannot remove that influence.
- Descriptive human–AI overlap is not intercoder reliability, methodological validation, or evidence of correctness.
- The draft methods statement must be adapted to the actual method, model, provider, governance, and institutional requirements.

## Project documents

- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security and research-data guidance](SECURITY.md)
- [Architecture note](docs/ARCHITECTURE.md)
- [Issue-ready backlog](docs/ISSUE_BACKLOG.md)
- [Release privacy and secret checklist](docs/RELEASE_CHECKLIST.md)

## Contributing

Methodological critique, usability feedback, accessibility improvements, research-tool export examples, and carefully scoped code contributions are welcome. Please start with [CONTRIBUTING.md](CONTRIBUTING.md) and use the issue templates so product and methodological impact stay visible alongside implementation details.

## License

MIT © QualiAudit contributors. See [LICENSE](LICENSE).
