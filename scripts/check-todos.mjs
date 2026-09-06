import {
    execFileSync
} from 'node:child_process';

let output = '';

try {
    output = execFileSync(
        'git',
        [
            'grep',
            '-n',
            '-E',
            'TODO',
            '--',
            '*.ts',
            '*.tsx',
            '*.js',
            '*.jsx',
        ], {
            encoding: 'utf8',
        },
    );
} catch (error) {
    // git grep は一致が0件の場合 exit code 1 になる。
    if (error.status === 1) {
        process.exit(0);
    }

    throw error;
}

const invalidLines = output
    .split('\n')
    .filter(Boolean)
    .filter((line) => !/TODO\(#\d+\):/.test(line));

if (invalidLines.length === 0) {
    process.exit(0);
}

console.error('Issue番号のないTODOがあります:\n');
console.error(invalidLines.join('\n'));

process.exit(1);