import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const secretPatterns = [
    {
        name: 'private key',
        pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
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
        pattern: /\bAKIA[0-9A-Z]{16}\b/,
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

const ignoredFiles = new Set([
    'pnpm-lock.yaml',
]);

function getTrackedFiles() {
    return execFileSync('git', ['ls-files', '-z'], {
        encoding: 'utf8',
    })
        .split('\0')
        .filter(Boolean);
}

function shouldScan(file) {
    if (ignoredFiles.has(file)) {
        return false;
    }

    return statSync(file).size <= 1024 * 1024;
}

function isBinary(content) {
    return content.includes('\0');
}

const findings = [];

for (const file of getTrackedFiles()) {
    if (!shouldScan(file)) {
        continue;
    }

    const content = readFileSync(file, 'utf8');

    if (isBinary(content)) {
        continue;
    }

    for (const [index, line] of content.split('\n').entries()) {
        for (const secret of secretPatterns) {
            if (secret.pattern.test(line)) {
                findings.push({
                    file,
                    line: index + 1,
                    type: secret.name,
                });
            }
        }
    }
}

if (findings.length === 0) {
    process.exit(0);
}

console.error('Secret-like values were detected:\n');

for (const finding of findings) {
    console.error(
        `- ${finding.file}:${finding.line} (${finding.type})`,
    );
}

console.error(
    '\nRemove the credential from Git history and rotate it if it was real. Security gates must not be weakened solely to make CI pass.',
);

process.exit(1);
