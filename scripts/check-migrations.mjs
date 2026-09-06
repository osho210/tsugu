import {
    execFileSync
} from 'node:child_process';

const dangerousPatterns = [
    /\bDROP\s+TABLE\b/i,
    /\bDROP\s+COLUMN\b/i,
    /\bALTER\s+COLUMN\b.*\bTYPE\b/i,
    /\bSET\s+NOT\s+NULL\b/i,
];

let output = '';

try {
    output = execFileSync(
        'git',
        [
            'grep',
            '-n',
            '-E',
            'DROP TABLE|DROP COLUMN|SET NOT NULL|ALTER COLUMN',
            '--',
            'apps/api/migrations/**/*.sql',
        ], {
            encoding: 'utf8',
        },
    );
} catch (error) {
    if (error.status === 1) {
        process.exit(0);
    }

    throw error;
}

const riskyLines = output
    .split('\n')
    .filter(Boolean)
    .filter((line) =>
        dangerousPatterns.some((pattern) => pattern.test(line)),
    );

if (riskyLines.length === 0) {
    process.exit(0);
}

console.error('High-risk migration detected:\n');
console.error(riskyLines.join('\n'));
console.error(
    '\nDestructive migrations require explicit Human review.',
);

process.exit(1);