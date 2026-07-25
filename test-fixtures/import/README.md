# Synthetic import validation corpus

These files are fictional test fixtures. They contain no participant data and are not product examples.

- `semicolon-unicode-codebook.csv` checks semicolon delimiters and Unicode text.
- `tab-coded-excerpts.tsv` checks tab-delimited records and punctuation that includes commas.
- `multi-code-excerpts.csv` checks explicit rejection of multiple primary codes in one cell.
- `segment-boundary-excerpts.csv` checks overlapping segments from the same fictional source.
- `malformed-row-width.csv` checks rejection of rows whose column count differs from the header.

The corpus exists to make import assumptions visible and reproducible. Passing these fixtures does not imply compatibility with every research-tool export.
