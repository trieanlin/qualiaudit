# Formative study manifest template

> **Blank operational template — not ethics approval or participant material.**
>
> Complete a copy only in the approved research location. Do not commit a
> completed manifest, approval document, participant identifier, access token,
> recruitment record, or storage path to this public repository.

## Readiness state

- Manifest status: `Draft` / `Ready for advisor review` / `Frozen for study`
- Governance decision: `Not ready` / `Ready with conditions` / `Ready`
- Conditions that remain open:
- Responsible study role (record the person outside this public copy):
- Manifest version:
- Manifest freeze date:

`Frozen for study` means that the operational configuration below has been
recorded. It does not itself mean that an institution has approved recruitment.

## Study and protocol identity

- Study title or approved short label:
- Institutional determination/reference (reference only; do not attach it here):
- Approved protocol version:
- Session-guide version or commit:
- Observation-template version or commit:
- Analysis-plan version or commit:
- Participant-information/consent version (stored separately):
- Withdrawal/debrief procedure version (stored separately):

## QualiAudit build freeze

- QualiAudit release/tag:
- Exact Git commit:
- Deployment URL or local-build identifier:
- Deployment owner:
- Freeze-screen reviewer option: `Local deterministic reviewer`
- Reviewer protocol shown by the application:
- Synthetic project/reset procedure:
- Date the frozen build was rechecked:

Do not substitute a newer deployment during data collection without recording a
protocol deviation or approved amendment. A moving `main` deployment is not a
stable study identifier on its own.

## Permitted task material and network boundary

- Permitted material: `Bundled fictional synthetic project only`
- Participant upload enabled for the session: `No`
- Real participant/research data permitted: `No`
- Remote reviewer selected: `No`
- API key required: `No`
- Expected third-party model transmission: `None`
- Network/provider state checked by:
- Check date and evidence location:
- Stop procedure if real data or unexpected transmission appears:

## Sampling and session configuration

Record approved details without copying names or contact information into the
manifest.

- Recruitment route:
- Inclusion/exclusion logic:
- Compensation arrangement:
- Planned participant range and stopping rationale:
- Mode allocation: `Codebook / Framework` / `Reflexive` / `Both`
- Mode-order allocation procedure:
- Case-order rotation procedure:
- Session duration range:
- Recording: `Off` / `Separately approved and consented`
- Session location or remote platform:

Use pseudonymous study IDs in observation files. Keep the re-identification key,
if one is permitted, outside QualiAudit and separate from session observations.

## Browser, device, and access readiness

- Supported browser(s) and version range:
- Device class(es):
- Keyboard path checked:
- Screen-reader path checked, if in scope:
- Zoom/reflow and text-spacing checks:
- Reduced-motion and contrast checks:
- Accommodation request and escalation route:
- Known access limitations disclosed in approved participant material:

An engineering or manual accessibility check is evidence about the tested path,
not a general WCAG conformance claim.

## Data-management configuration

- Approved observation location:
- Approved recording/transcript location, if applicable:
- Roles with access:
- Recruitment/consent records stored separately: `Yes` / `No`
- Retention period:
- Withdrawal/deletion procedure:
- Backup handling:
- Incident-response route:
- Public-repository prohibition communicated to the study team: `Yes` / `No`

Do not enter secret URLs, personal filesystem paths, participant details, or
credentials in a copy that could be published.

## Pre-session verification

- [ ] The [governance gate](GOVERNANCE_GATE.md) has a local disposition.
- [ ] The exact protocol and application versions above are accessible.
- [ ] The deployed page identifies the expected release/build.
- [ ] The synthetic project starts from the intended state.
- [ ] The local deterministic reviewer is available and selected.
- [ ] No remote reviewer or API key is required.
- [ ] The facilitator can stop an attempted real-data import.
- [ ] Assigned mode and case order are recorded before the session.
- [ ] Approved access accommodations are available.
- [ ] Recording state matches the approved procedure.
- [ ] The observation file uses only a pseudonymous study ID.
- [ ] Local storage, project-file sensitivity, deletion, and export boundaries
      can be demonstrated accurately.
- [ ] A protocol-deviation and incident route is ready.

## Change control

Repeat this row for every change after the manifest is frozen.

| Date | Item changed | Reason | Evidence/approval reference | Sessions affected | Disposition |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Do not silently replace the protocol, task order, synthetic material, deployment,
or observation fields once sessions have started.

## Freeze decision

- Outstanding conditions reviewed:
- Decision: `Not ready` / `Ready with conditions` / `Ready`
- Decision date:
- Responsible roles:
- Next review trigger:

Store the completed decision with the approved study record. A checked-in blank
template is not evidence that any gate has been satisfied.
