# Synthetic import validation corpus

These files are fictional test fixtures. They contain no participant data and are not product examples.

- `semicolon-unicode-codebook.csv` checks semicolon delimiters and Unicode text.
- `tab-coded-excerpts.tsv` checks tab-delimited records and punctuation that includes commas.
- `multi-code-excerpts.csv` checks explicit rejection of multiple primary codes in one cell.
- `segment-boundary-excerpts.csv` checks overlapping segments from the same fictional source.
- `malformed-row-width.csv` checks rejection of rows whose column count differs from the header.
- `synthetic-tool-export-profiles.xlsx` checks explicit column-label mapping aids for selected
  NVivo codebook, MAXQDA retrieved-segment, and ATLAS.ti quotation-report layouts. Its four
  sheets are fully fictional and include an `Info` sheet that must not be selected as research data.

The corpus exists to make import assumptions visible and reproducible. Passing these fixtures does not imply compatibility with every research-tool export.
