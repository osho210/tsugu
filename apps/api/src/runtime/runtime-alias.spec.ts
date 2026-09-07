import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const apiRoot = process.cwd();

describe('API runtime alias', () => {
  describe('正常系', () => {
    it('directory aliasの場合、dist配下のindex.jsを解決できること', () => {
      const fixtureDirectory = join(apiRoot, 'dist', '__runtime_alias_fixture__');
      mkdirSync(fixtureDirectory, { recursive: true });
      writeFileSync(join(fixtureDirectory, 'index.js'), "export const marker = 'alias-directory-ok';\n");

      try {
        const result = spawnSync(
          process.execPath,
          [
            '--import',
            join(apiRoot, 'register-alias.mjs'),
            '--input-type=module',
            '--eval',
            "const value = await import('@/__runtime_alias_fixture__'); if (value.marker !== 'alias-directory-ok') process.exit(1);",
          ],
          { cwd: apiRoot, encoding: 'utf-8' },
        );

        expect(result.status).toBe(0);
        expect(result.signal).toBeNull();
        expect(result.stderr).toBe('');
      } finally {
        rmSync(fixtureDirectory, { recursive: true, force: true });
      }
    });
  });

  describe('signal forwarding', () => {
    it.each([
      ['SIGINT', 130],
      ['SIGTERM', 143],
    ] as const)('%sを受け取った場合、Nest childへ転送して終了code %sになること', async (signal, expectedCode) => {
      const fixtureDirectory = mkdtempSync(join(tmpdir(), 'tsugu-start-nest-'));
      const pidFile = join(fixtureDirectory, 'child.pid');
      const fakeNestCli = join(fixtureDirectory, 'fake-nest.mjs');
      writeFileSync(
        fakeNestCli,
        `import { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(pidFile)}, String(process.pid));\nsetInterval(() => {}, 1_000);\n`,
      );

      const wrapper = spawn(process.execPath, [join(apiRoot, 'start-nest.mjs'), 'start'], {
        cwd: apiRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          TSUGU_NEST_CLI_PATH: fakeNestCli,
        },
        stdio: 'ignore',
      });

      try {
        await waitForFile(pidFile);
        const childPid = Number(readFileSync(pidFile, 'utf-8'));
        wrapper.kill(signal);
        const result = await waitForExit(wrapper);

        expect(result.code).toBe(expectedCode);
        expect(result.signal).toBeNull();
        expect(isProcessAlive(childPid)).toBe(false);
      } finally {
        if (!wrapper.killed) {
          wrapper.kill('SIGKILL');
        }
        rmSync(fixtureDirectory, { recursive: true, force: true });
      }
    });
  });
});

async function waitForFile(path: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(path)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error('fake Nest childの起動を確認できませんでした。');
}

function waitForExit(child: ReturnType<typeof spawn>): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
