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

function resolveBaseRef() {
  if (tryGit(['rev-parse', '--verify', baseRef])) {
    return baseRef;
  }

  if (baseRef.startsWith('origin/')) {
    const localRef = baseRef.slice('origin/'.length);

    if (tryGit(['rev-parse', '--verify', localRef])) {
      return localRef;
    }
  }

  throw new Error(
    `Secret scan base ref could not be resolved: ${baseRef}. Fetch the base branch or set BASE_REF explicitly.`,
  );
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
  const resolvedBaseRef = resolveBaseRef();
  const mergeBase = runGit(['merge-base', resolvedBaseRef, 'HEAD']);
  const head = runGit(['rev-parse', 'HEAD']);

  if (mergeBase === head) {
    return [];
  }

  const output = runGit([
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

    if (runGit(['cat-file', '-t', sha]) !== 'blob') {
      continue;
    }

    const size = Number(runGit(['cat-file', '-s', sha]));

    if (!Number.isFinite(size)) {
      throw new Error(`Could not determine Git object size: ${sha}`);
    }

    if (size > maxFileSize) {
      continue;
    }

    seen.add(key);
    blobs.push({ sha, path });
  }

  return blobs;
}

function scanIntroducedHistory(findings) {
  for (const blob of getIntroducedBlobs()) {
    scanContent({
      source: `${blob.path} @ ${blob.sha.slice(0, 12)}`,
      content: runGit(['cat-file', '-p', blob.sha]),
      findings,
    });
  }
}

const findings = [];

try {
  scanCurrentTree(findings);
  scanIntroducedHistory(findings);
} catch (error) {
  console.error('Secret scan could not inspect the required Git state.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

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
