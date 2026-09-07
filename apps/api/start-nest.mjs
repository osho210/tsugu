import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aliasHookUrl = new URL('./register-alias.mjs', import.meta.url).href;
const existingNodeOptions = process.env.NODE_OPTIONS?.trim();
const preloadOption = `--import=${aliasHookUrl}`;
const nodeOptions = existingNodeOptions
  ? `${existingNodeOptions} ${preloadOption}`
  : preloadOption;

const defaultNestCliPath = fileURLToPath(
  new URL('./node_modules/@nestjs/cli/bin/nest.js', import.meta.url),
);
const nestCliPath =
  process.env.NODE_ENV === 'test' && process.env.TSUGU_NEST_CLI_PATH
    ? process.env.TSUGU_NEST_CLI_PATH
    : defaultNestCliPath;
const child = spawn(process.execPath, [nestCliPath, ...process.argv.slice(2)], {
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
  stdio: 'inherit',
});

const forwardedSignals = ['SIGINT', 'SIGTERM'];
const signalHandlers = new Map();
let childExited = false;

child.once('exit', () => {
  childExited = true;
});

for (const signal of forwardedSignals) {
  const handler = () => {
    if (!childExited) {
      child.kill(signal);
    }
  };
  signalHandlers.set(signal, handler);
  process.on(signal, handler);
}

const result = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', (code, signal) => resolve({ code, signal }));
});

for (const [signal, handler] of signalHandlers) {
  process.off(signal, handler);
}

if (result.signal === 'SIGINT') {
  process.exitCode = 130;
} else if (result.signal === 'SIGTERM') {
  process.exitCode = 143;
} else {
  process.exitCode = result.code ?? 1;
}
