import {
    execFileSync
} from 'node:child_process';
import {
    readFileSync
} from 'node:fs';

import tseslint from 'typescript-eslint';

const files = execFileSync(
        'git',
        [
            'ls-files',
            '-z',
            '--',
            '*.js',
            '*.jsx',
            '*.mjs',
            '*.cjs',
            '*.ts',
            '*.tsx',
            '*.mts',
            '*.cts',
        ], {
            encoding: 'utf8'
        },
    )
    .split('\0')
    .filter(Boolean);

const invalidComments = [];

for (const file of files) {
    const source = readFileSync(file, 'utf8');

    const {
        ast
    } = tseslint.parser.parseForESLint(source, {
        filePath: file,
        loc: true,
        comment: true,
    });

    for (const comment of ast.comments ?? []) {
        // TODO(#123): だけ許可
        if (/\bTODO\b(?!\(#\d+\):)/.test(comment.value)) {
            invalidComments.push(
                `${file}:${comment.loc.start.line}: ${comment.value.trim()}`,
            );
        }
    }
}

if (invalidComments.length === 0) {
    process.exit(0);
}

console.error('Issue番号のないTODOコメントがあります:\n');
console.error(invalidComments.join('\n'));

process.exit(1);