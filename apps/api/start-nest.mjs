import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aliasHookPath = fileURLToPath(new URL('./register-alias.mjs', import.meta.url));
const existingNodeOptions = process.env.NODE_OPTIONS?.trim();
const preloadOption = `--import=${aliasHookPath}`;
const nodeOptions = existingNodeOptions
  ? `${existingNodeOptions} ${preloadOption}`
  : preloadOption;

const nestCliPath = fileURLToPath(
  new URL('./node_modules/@nestjs/cli/bin/nest.js', import.meta.url),
);
const result = spawnSync(process.execPath, [nestCliPath, ...process.argv.slice(2)], {
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
