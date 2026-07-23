import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const expectedIdentity = {
  name: 'QualiAudit Contributors',
  email: 'qualiaudit@users.noreply.github.com',
}

const contentRules = [
  ['OpenAI-style API key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g],
  ['GitHub token', /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{20,}\b/g],
  ['Slack token', /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['macOS home-directory path', /\/Users\/[A-Za-z0-9._-]+\//g],
  ['Windows home-directory path', /[A-Za-z]:\\Users\\[^\\\s]+\\/g],
  ['Local-machine email', /\b[^\s<>]+@[^\s<>]+\.local\b/gi],
  ['Common personal email', /\b[^\s<>]+@(?:gmail|outlook|hotmail|icloud|yahoo|protonmail|qq|163)\.[A-Za-z]{2,}\b/gi],
]

const issues = []

function scanText(scope, text) {
  for (const [label, pattern] of contentRules) {
    pattern.lastIndex = 0
    if (pattern.test(text)) issues.push(`${scope}: ${label}`)
  }
}

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)

for (const file of trackedFiles) {
  const bytes = readFileSync(file)
  if (bytes.length > 2_000_000 || bytes.includes(0)) continue
  scanText(file, bytes.toString('utf8'))
}

const patchHistory = execFileSync('git', ['log', 'HEAD', '-p', '--format=', '--', '.'], {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
})
scanText('Git patch history', patchHistory)

const metadata = execFileSync('git', ['log', 'HEAD', '--format=%an%x09%ae%x09%cn%x09%ce'], {
  encoding: 'utf8',
})

for (const [authorName, authorEmail, committerName, committerEmail] of metadata.trim().split('\n').map((line) => line.split('\t'))) {
  if (
    authorName !== expectedIdentity.name
    || authorEmail !== expectedIdentity.email
    || committerName !== expectedIdentity.name
    || committerEmail !== expectedIdentity.email
  ) {
    issues.push('Git commit metadata: non-sanitised author or committer identity')
    break
  }
}

if (issues.length) {
  console.error('Release safety check failed:')
  for (const issue of [...new Set(issues)]) console.error(`- ${issue}`)
  process.exitCode = 1
} else {
  console.log(`Release safety check passed for ${trackedFiles.length} tracked files and the current branch history.`)
}
