import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const maxFileSize = 1024 * 1024;
const baseRef = process.env.BASE_REF || 'origin/main';

const secretPatterns = [
  {
    name: 'private key',
    pattern:
      /-----BEGIN (?:ENCRYPTED |RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: 'GitHub token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  },
  {
    name: 'GitHub fine-grained token',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  },
  {
    name: 'AWS access key',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  },
  {
    name: 'Slack token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  },
  {
    name: 'OpenAI-style secret key',
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/,
  },
];

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
  }).trim();
}

function tryGit(args) {
  try {
    return runGit(args);
  } catch {
    return null;
  }
}

function isBinary(content) {
  return content.includes('\0');
}

function scanContent({ source, content, findings }) {
  if (isBinary(content)) {
    return;
  }

  for (const [index, line] of content.split('\n').entries()) {
    for (const secret of secretPatterns) {
      if (secret.pattern.test(line)) {
        findings.push({
          source,
          line: index + 1,
          type: secret.name,
        });
      }
    }
  }
}

function scanCurrentTree(findings) {
  const files = runGit(['ls-files', '-z'])
    .split('\0')
    .filter(Boolean);

  for (const file of files) {
    if (statSync(file).size > maxFileSize) {
      continue;
    }

    scanContent({
      source: file,
      content: readFileSync(file, 'utf8'),
      findings,
    });
  }
}

function getIntroducedBlobs() {
  const mergeBase = tryGit(['merge-base', baseRef, 'HEAD']);

  if (!mergeBase || mergeBase === tryGit(['rev-parse', 'HEAD'])) {
    return [];
  }

  const output = tryGit([
    'rev-list',
    '--objects',
    `${mergeBase}..HEAD`,
  ]);

  if (!output) {
    return [];
  }

  const blobs = [];
  const seen = new Set();

  for (const line of output.split('\n').filter(Boolean)) {
    const separator = line.indexOf(' ');

    if (separator === -1) {
      continue;
    }

    const sha = line.slice(0, separator);
    const path = line.slice(separator + 1);
    const key = `${sha}:${path}`;

    if (seen.has(key)) {
      continue;
    }

    if (tryGit(['cat-file', '-t', sha]) !== 'blob') {
      continue;
    }

    const size = Number(tryGit(['cat-file', '-s', sha]));

    if (!Number.isFinite(size) || size > maxFileSize) {
      continue;
    }

    seen.add(key);
    blobs.push({ sha, path });
  }

  return blobs;
}

function scanIntroducedHistory(findings) {
  for (const blob of getIntroducedBlobs()) {
    const content = tryGit(['cat-file', '-p', blob.sha]);

    if (content === null) {
      continue;
    }

    scanContent({
      source: `${blob.path} @ ${blob.sha.slice(0, 12)}`,
      content,
      findings,
    });
  }
}

const findings = [];

scanCurrentTree(findings);
scanIntroducedHistory(findings);

const uniqueFindings = [
  ...new Map(
    findings.map((finding) => [
      `${finding.source}:${finding.line}:${finding.type}`,
      finding,
    ]),
  ).values(),
];

if (uniqueFindings.length === 0) {
  process.exit(0);
}

console.error('Secret-like values were detected:\n');

for (const finding of uniqueFindings) {
  console.error(
    `- ${finding.source}:${finding.line} (${finding.type})`,
  );
}

console.error(
  '\nRemove the credential from Git history and rotate it if it was real. Security gates must not be weakened solely to make CI pass.',
);

process.exit(1);
