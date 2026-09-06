import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const migrationPathPattern = /^apps\/api\/migrations\/.*\/ops\.json$/;

const dangerousSqlPatterns = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bALTER\s+COLUMN\b.*\bTYPE\b/is,
  /\bSET\s+NOT\s+NULL\b/i,
];

const highRiskOperationClasses = new Set([
  'destructive',
  'data',
]);

const migrationApproved = process.env.MIGRATION_APPROVED === 'true';
const baseRef = process.env.BASE_REF || 'origin/main';

function execGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
  }).trim();
}

function getChangedMigrationFiles() {
  const mergeBase = execGit(['merge-base', baseRef, 'HEAD']);
  const output = execGit([
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    `${mergeBase}...HEAD`,
    '--',
    'apps/api/migrations',
  ]);

  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .filter(Boolean)
    .filter((path) => migrationPathPattern.test(path));
}

function collectSql(operation) {
  const sections = [
    ...(operation.precheck ?? []),
    ...(operation.execute ?? []),
    ...(operation.postcheck ?? []),
  ];

  return sections
    .map((step) => step.sql)
    .filter((sql) => typeof sql === 'string');
}

const changedMigrationFiles = getChangedMigrationFiles();

if (changedMigrationFiles.length === 0) {
  process.exit(0);
}

const risks = [];

for (const file of changedMigrationFiles) {
  const operations = JSON.parse(readFileSync(file, 'utf8'));

  for (const operation of operations) {
    const reasons = [];

    if (highRiskOperationClasses.has(operation.operationClass)) {
      reasons.push(`operationClass=${operation.operationClass}`);
    }

    for (const sql of collectSql(operation)) {
      for (const pattern of dangerousSqlPatterns) {
        if (pattern.test(sql)) {
          reasons.push(`dangerous SQL: ${sql.replace(/\s+/g, ' ').trim()}`);
          break;
        }
      }
    }

    if (reasons.length > 0) {
      risks.push({
        file,
        id: operation.id ?? 'unknown',
        label: operation.label ?? 'unknown',
        reasons,
      });
    }
  }
}

if (risks.length === 0) {
  process.exit(0);
}

console.error('High-risk migration detected:\n');

for (const risk of risks) {
  console.error(`- ${risk.file}`);
  console.error(`  operation: ${risk.id} (${risk.label})`);

  for (const reason of risk.reasons) {
    console.error(`  reason: ${reason}`);
  }
}

if (migrationApproved) {
  console.log('\nMigration risk was explicitly approved by a Human.');
  process.exit(0);
}

console.error(
  '\nDestructive or high-risk migrations require explicit Human approval. Add the migration-approved PR label after review.',
);

process.exit(1);
