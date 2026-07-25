# Research-tool import profiles

QualiAudit can suggest column mappings for a small set of tabular `.xlsx` exports. These profiles
are transparent mapping aids, not native integrations. Every suggestion remains visible and editable
before import.

## Supported mapping aids

| Profile | Intended workbook | Recognised English column signals | QualiAudit mapping |
| --- | --- | --- | --- |
| NVivo codebook | Codebook-style Excel export | `Name`, `Description`, plus supporting `Files` or `References` columns | code and definition |
| NVivo coding report | A report that exposes each coded reference as a row | reference ID, source/file, coded text, code/node | excerpt ID, source ID, excerpt, human code |
| MAXQDA retrieved segments | Retrieved/coded segments exported to Excel | document, coded/retrieved segment, code, optional comment | source ID, excerpt, human code, optional rationale |
| ATLAS.ti quotation report | Quotation Excel report | `ID`, `Document`, `Quotation Content`, `Codes`, `Reference` | excerpt ID, source ID, excerpt, human code, context |

Detection is based on column labels, never on a vendor logo, workbook filename, or worksheet name
alone. A profile is suggested only when enough independent column signals are present. Ties fall
back to generic/manual mapping.

## Deliberate safeguards

- A researcher must confirm every mapping before records replace the current material.
- A required QualiAudit field that has no source column remains visibly unmapped and blocks import.
- QualiAudit does not invent excerpt IDs or infer a code from a worksheet, code group, or folder name.
- A cell containing several primary codes is surfaced as a blocking validation issue because the
  current schema records one primary human code per excerpt.
- Profile selection changes mapping suggestions only. It does not weaken row limits, file limits,
  structural checks, codebook validation, or the blind-review boundary.
- Workbooks are read locally in the browser. The public demo does not upload them or send them to a
  model provider.

## Important compatibility boundaries

- Supported input is `.xlsx`. Older `.xls` files must first be resaved as `.xlsx`.
- QualiAudit does **not** open native NVivo, MAXQDA, or ATLAS.ti project files.
- Vendor versions, locales, report options, renamed columns, hierarchy layouts, and multiple-code
  representations vary. Manual mapping may therefore be necessary even for a listed tool.
- The profiles do not promise lossless round-tripping or compatibility with every export.
- An `Info` or metadata worksheet is skipped when QualiAudit chooses an initial worksheet, unless
  the workbook contains no other readable sheet. Researchers can still select any sheet deliberately.

The fictional regression workbook
[`synthetic-tool-export-profiles.xlsx`](../test-fixtures/import/synthetic-tool-export-profiles.xlsx)
makes the recognised shapes inspectable. It is a test fixture, not a vendor-generated file and not
evidence of complete product compatibility.

## Documentation used to define the boundary

The profiles follow documented spreadsheet/report export routes while keeping assumptions modest:

- [ATLAS.ti: Creating Excel Reports](https://manuals.atlasti.com/Win/en/manual/Reports/ReportsCreatingExcel.html)
- [ATLAS.ti: Example Reports](https://manuals.atlasti.com/Win/en/manual/Reports/ReportsExample.html)
- [MAXQDA: Print or Export Retrieved Segments](https://www.maxqda.com/help-mx22/segment-retrieval/print-export-retrieved-segments)
- [MAXQDA: Exporting Data from Your Project](https://help.maxqda.com/en/support/solutions/articles/80001150558-exporting-data-from-your-maxqda-project)
- [NVivo: Coding reports and summaries](https://help-nv.qsrinternational.com/20/win/Content/coding/automatic-coding-existing-patterns.htm)
- [Lumivero: NVivo 15.3 export update](https://lumivero.com/resources/blog/nvivo-15-3-release/)

Vendor documentation and exported layouts can change. Maintainers should update fixtures and
profiles only from fictional or explicitly shareable examples, and should describe the tested
version and locale in the pull request.
