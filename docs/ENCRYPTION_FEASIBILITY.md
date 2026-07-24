# Browser encryption feasibility

This note records the v0.1 decision about encryption at rest. It is not a claim that QualiAudit is suitable for sensitive research data.

## Current risk boundary

QualiAudit automatically saves one working review in browser `localStorage`. That record is plain text and may include excerpts, context, human and second-coder judgments, frozen snapshots, AI reviews, and decisions. A downloaded `.qualiaudit.json` project file contains the same kind of material and is also plain text.

Local storage avoids sending data to a QualiAudit server, but it does not protect the record from:

- another person or process with access to the same browser profile;
- malicious browser extensions or same-origin script execution;
- device compromise, backups, or copied download files;
- disclosure while an unlocked project is open in the application.

## Options considered

### Rely on browser or operating-system storage protection

This adds no application-managed key and has the lowest usability cost, but its behaviour varies by device and profile. QualiAudit cannot verify or accurately describe it as project encryption.

### Encrypt the browser record with a user passphrase

The Web Crypto API could derive a key from a passphrase and encrypt a versioned project envelope. This could reduce exposure of data at rest, but it introduces password recovery, key lifetime, migration, corruption, accessibility, and false-assurance risks. It does not protect data after the project is unlocked or against hostile code running in the same page.

### Do not retain working state automatically

Session-only state reduces persistence but makes accidental tab closure destructive and weakens the no-account workflow. It also does not protect explicitly downloaded project files.

## v0.1 decision

QualiAudit keeps the local-first workflow but makes retention visible and deletion explicit:

- **Data & privacy** shows whether a review is saved, its approximate size, stage, and record counts.
- **Delete local review** removes only QualiAudit’s own browser-storage key after a second confirmation.
- The interface distinguishes browser deletion from deletion of downloaded project files.
- The public guidance continues to prohibit sensitive, identifiable, embargoed, or regulated research data.

Application-level encryption is not implemented in v0.1. Presenting an unreviewed passphrase feature as “secure storage” would create more confidence than the current evidence supports.

## Preconditions for a future encrypted format

Before implementation, a dedicated design and security review should define:

1. the threat model and institutional governance use cases;
2. a versioned authenticated-encryption envelope with fresh salt and nonce;
3. passphrase derivation parameters, in-memory key lifetime, and no persisted raw key;
4. recovery and irreversible-loss language that is understandable and accessible;
5. migration, corruption, tamper, Unicode-passphrase, and large-project tests;
6. dependency, content-security-policy, and same-origin script controls;
7. independent security review before changing the public data-suitability claim.

Until those conditions are met, encryption remains a research and engineering question rather than a product promise.
