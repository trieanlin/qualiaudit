# Release privacy and secret checklist

Run this checklist before making the repository public or publishing a release.

## Automated check

```bash
npm run check:release
npm run check
```

The release check reports rule names and affected scopes without printing a suspected secret value. It scans tracked text files, the patch history reachable from `HEAD`, and commit identity metadata.

## Identity and local-machine information

- [ ] `git log --format=fuller` uses a GitHub-provided `@users.noreply.github.com` address for authors and committers.
- [ ] No tracked file contains a macOS or Windows user home-directory path, a computer hostname, or a private email.
- [ ] Screenshot metadata and visible UI contain no account name, browser profile, notifications, or local path.
- [ ] GitHub account email privacy is enabled before making future commits.

Recommended repository-local identity:

```bash
git config user.name "<your-public-github-name>"
git config user.email "<your-github-noreply-address>"
```

## API keys and credentials

- [ ] `.env`, `.env.*`, private keys, and common credential files are ignored; `.env.example` contains placeholders only.
- [ ] No secret is named with a `VITE_` prefix or imported by browser code.
- [ ] A real-model key is read only by a server-side endpoint.
- [ ] Any accidentally committed key has been revoked or rotated even if Git history was rewritten.

## Research data

- [ ] Demo excerpts are synthetic and explicitly described as fictional.
- [ ] Source and excerpt IDs cannot be mapped to real participants.
- [ ] Screenshots, tests, fixtures, issue examples, and logs use synthetic records only.
- [ ] No public demo or CI artifact contains real research data.

## If unsafe commits were already pushed

Cleaning the local branch does not remove commits already present on GitHub. Coordinate with collaborators, force-push the sanitised branch using `--force-with-lease`, remove unsafe tags or branches, and ask collaborators to re-clone. Treat any exposed credential as compromised and rotate it; history rewriting is not credential revocation.
