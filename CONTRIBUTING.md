# Contributing to QualiAudit

Thanks for helping build a more transparent review layer for qualitative research.

## Before opening a change

Use a GitHub issue template and explain both the user need and the methodological consequence. For interface language, describe how the change behaves in codebook/framework and reflexive modes. Do not introduce wording that implies the AI verifies truth, replaces a coder, or owns the final decision.

## Local workflow

1. Use Node.js 20 or newer.
2. Run `npm ci`.
3. Create a focused branch.
4. Add or update tests for changed review logic or data boundaries.
5. Run `npm run check` before opening a pull request.

Keep commits scoped to meaningful behaviour. Do not combine unrelated refactors with methodological or user-facing changes.

## Pull request checklist

- The blind payload still excludes human interpretation fields.
- Method-specific language has been checked in both modes.
- Synthetic examples are unambiguously fictional.
- Data destination and third-party transmission are accurately described.
- Keyboard, responsive, and reduced-motion behaviour were considered.
- Tests and documentation reflect the change.

## Research data

Never commit real participant material, API keys, access tokens, or institutional research data. Bug reproductions should use minimal synthetic fixtures.
