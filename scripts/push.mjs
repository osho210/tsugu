import { confirm, input, select } from '@inquirer/prompts';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const remote = 'origin';

function runCommand(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function runGit(args, options = {}) {
  return runCommand('git', args, options);
}

function tryCommand(command, args) {
  try {
    return runCommand(command, args);
  } catch {
    return null;
  }
}

function tryGit(args) {
  return tryCommand('git', args);
}

function getCurrentBranch() {
  const branch = runGit(['branch', '--show-current']);

  if (!branch) {
    console.error('detached HEAD のため処理できません。');
    process.exit(1);
  }

  return branch;
}

function ensureRemoteExists() {
  const remotes = runGit(['remote']).split('\n').filter(Boolean);

  if (!remotes.includes(remote)) {
    console.error(`remote "${remote}" が存在しません。`);
    process.exit(1);
  }
}

function ensureGitHubCli() {
  if (!tryCommand('gh', ['--version'])) {
    console.error('GitHub CLI が見つかりません。');
    console.error('gh をインストールしてから再実行してください。');
    process.exit(1);
  }

  if (!tryCommand('gh', ['auth', 'status'])) {
    console.error('GitHub CLI にログインしていません。');
    console.error('gh auth login を実行してください。');
    process.exit(1);
  }
}

function fetchRemote() {
  try {
    execFileSync('git', ['fetch', remote, '--quiet'], {
      stdio: 'inherit',
    });
  } catch {
    console.warn('\nremoteの最新情報を取得できませんでした。既存のremote refを使用します。\n');
  }
}

function getUpstream() {
  return tryGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
}

function getDefaultRemoteBranch() {
  const symbolic = tryGit(['symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`]);

  if (symbolic) {
    return symbolic;
  }

  if (tryGit(['rev-parse', '--verify', `refs/remotes/${remote}/main`])) {
    return `${remote}/main`;
  }

  if (tryGit(['rev-parse', '--verify', `refs/remotes/${remote}/master`])) {
    return `${remote}/master`;
  }

  return null;
}

function getRemoteBranches(currentBranch) {
  const output = tryGit([
    'for-each-ref',
    '--format=%(refname:short)',
    `refs/remotes/${remote}`,
  ]);

  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .map((branch) => branch.trim())
    .filter(Boolean)
    .filter((branch) => branch !== `${remote}/HEAD`)
    .filter((branch) => branch !== `${remote}/${currentBranch}`);
}

async function selectBaseBranch(currentBranch) {
  const branches = getRemoteBranches(currentBranch);
  const defaultBranch = getDefaultRemoteBranch();

  if (branches.length === 0) {
    console.error('比較可能なremote branchがありません。');
    process.exit(1);
  }

  const sortedBranches = [
    ...(defaultBranch && branches.includes(defaultBranch) ? [defaultBranch] : []),
    ...branches.filter((branch) => branch !== defaultBranch),
  ];

  return select({
    message: 'PRのbase branchを選択してください:',
    choices: sortedBranches.map((branch) => ({
      name: branch === defaultBranch ? `${branch} (default)` : branch,
      value: branch,
    })),
  });
}

function getMergeBase(baseBranch) {
  const mergeBase = tryGit(['merge-base', baseBranch, 'HEAD']);

  if (!mergeBase) {
    console.error(`${baseBranch} と現在branchの親ブランチを特定できませんでした。`);
    process.exit(1);
  }

  return mergeBase;
}

function getCommitsFromUpstream(upstream) {
  return tryGit(['log', `${upstream}..HEAD`, '--pretty=format:%h %s']);
}

function getCommitsFromBase(baseBranch) {
  return tryGit(['log', `${getMergeBase(baseBranch)}..HEAD`, '--pretty=format:%h %s']);
}

function getAllBranchCommits(baseBranch) {
  return tryGit(['log', `${getMergeBase(baseBranch)}..HEAD`, '--pretty=format:%h %s']);
}

function normalizeBaseBranch(base) {
  return base.replace(`${remote}/`, '');
}

function formatCommits(commits) {
  return commits
    .split('\n')
    .filter(Boolean)
    .map((commit) => `- ${commit}`)
    .join('\n');
}

function buildPrBody({ why, what, test, risk, relatedIssue, how, screenshot, commits }) {
  const sections = [
    `## Why\n\n${why}`,
    `## What\n\n${what}`,
    `## Test\n\n${test}`,
    `## Risk\n\n${risk}`,
    `## Related Issue\n\n${relatedIssue}`,
  ];

  if (how) {
    sections.push(`## How\n\n${how}`);
  }

  if (screenshot) {
    sections.push(`## Screenshot\n\n${screenshot}`);
  }

  sections.push(`## Commits\n\n${formatCommits(commits)}`);

  return `${sections.join('\n\n')}\n`;
}

function updateCommitsSection(body, commits) {
  const commitsSection = `## Commits\n\n${formatCommits(commits)}`;
  const lines = (body ?? '').replace(/\r\n/g, '\n').split('\n');
  const result = [];

  let skippingCommits = false;
  let commitsInserted = false;

  for (const line of lines) {
    if (/^## Commits\s*$/.test(line)) {
      if (!commitsInserted) {
        result.push(commitsSection);
        commitsInserted = true;
      }

      skippingCommits = true;
      continue;
    }

    if (skippingCommits) {
      if (/^##\s+/.test(line)) {
        skippingCommits = false;
        result.push(line);
      }

      continue;
    }

    result.push(line);
  }

  if (!commitsInserted) {
    result.push('', commitsSection);
  }

  return `${result.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function savePrBody(body) {
  const gitDir = runGit(['rev-parse', '--git-dir']);
  const dir = join(gitDir, 'tsugu');

  mkdirSync(dir, {
    recursive: true,
  });

  const path = join(dir, 'pr-body.md');
  writeFileSync(path, body, 'utf8');

  return path;
}

function getExistingPr() {
  const result = tryCommand('gh', ['pr', 'view', '--json', 'number,url,title,body']);

  return result ? JSON.parse(result) : null;
}

function createPullRequest({ branch, baseBranch, title, bodyPath }) {
  return runCommand(
    'gh',
    [
      'pr',
      'create',
      '--base',
      normalizeBaseBranch(baseBranch),
      '--head',
      branch,
      '--title',
      title,
      '--body-file',
      bodyPath,
    ],
    {
      stdio: ['inherit', 'pipe', 'inherit'],
    },
  );
}

function updatePullRequest({ number, title, bodyPath }) {
  const body = readFileSync(bodyPath, 'utf8');

  return runCommand(
    'gh',
    [
      'api',
      '--method',
      'PATCH',
      `repos/{owner}/{repo}/pulls/${number}`,
      '-f',
      `title=${title}`,
      '-f',
      `body=${body}`,
    ],
    {
      stdio: ['inherit', 'pipe', 'inherit'],
    },
  );
}

function requiredInput(message) {
  return input({
    message,
    validate(value) {
      return value.trim().length > 0 || '入力してください';
    },
  });
}

const branch = getCurrentBranch();

ensureRemoteExists();
ensureGitHubCli();
fetchRemote();

const upstream = getUpstream();
const hasUpstream = Boolean(upstream);

let comparisonBase;
let commits;

if (hasUpstream) {
  comparisonBase = getDefaultRemoteBranch();

  if (!comparisonBase) {
    console.error('default branchを特定できませんでした。');
    process.exit(1);
  }

  commits = getCommitsFromUpstream(upstream);
} else {
  console.log('\n初回pushです。');
  comparisonBase = await selectBaseBranch(branch);
  commits = getCommitsFromBase(comparisonBase);
}

if (!commits) {
  console.log('\npush対象のcommitはありません。');
  process.exit(0);
}

console.log('\n今回pushするcommit:\n');
console.log(commits);
console.log(`\n現在branch: ${branch}`);
console.log(`PR base:     ${comparisonBase}`);
console.log(`push先:      ${remote}/${branch}`);

const existingPr = getExistingPr();
let prContext = null;
let title;

if (existingPr) {
  title = existingPr.title;
  console.log('\n既存PRを更新します。');
  console.log(existingPr.url);
  console.log(`PR Title: ${existingPr.title}`);
} else {
  const why = await requiredInput('Why（なぜこの変更が必要か）:');
  const what = await requiredInput('What（何を変更したか）:');
  const test = await requiredInput('Test（どのように検証したか）:');
  const risk = await requiredInput('Risk（想定リスク・影響）:');
  const relatedIssue = await requiredInput('Related Issue（例: Closes #28）:');
  const how = await input({
    message: 'How（非自明な設計判断がある場合のみ・任意）:',
  });
  const screenshot = await input({
    message: 'Screenshot（UI変更時のみ・任意）:',
  });

  title = await input({
    message: 'PRタイトル:',
    default: what.trim(),
    validate(value) {
      return value.trim().length > 0 || 'PRタイトルを入力してください';
    },
  });

  prContext = {
    why: why.trim(),
    what: what.trim(),
    test: test.trim(),
    risk: risk.trim(),
    relatedIssue: relatedIssue.trim(),
    how: how.trim(),
    screenshot: screenshot.trim(),
  };
}

console.log('\n--------------------------------');
console.log('Push / Pull Request');
console.log('--------------------------------');
console.log(`Branch: ${branch}`);
console.log(`Base:   ${comparisonBase}`);
console.log('\nCommits');
console.log(commits);
console.log('\nPR Title');
console.log(title.trim());
console.log('--------------------------------\n');

const shouldProceed = await confirm({
  message: existingPr ? 'pushしてPRを更新しますか？' : 'pushしてPRを作成しますか？',
  default: true,
});

if (!shouldProceed) {
  console.log('処理をキャンセルしました。');
  process.exit(0);
}

if (hasUpstream) {
  execFileSync('git', ['push'], {
    stdio: 'inherit',
  });
} else {
  execFileSync('git', ['push', '-u', remote, 'HEAD'], {
    stdio: 'inherit',
  });
}

const allCommits = getAllBranchCommits(comparisonBase);

if (!allCommits) {
  console.error('PR用のcommit一覧を取得できませんでした。');
  process.exit(1);
}

const body = existingPr
  ? updateCommitsSection(existingPr.body, allCommits)
  : buildPrBody({
      ...prContext,
      commits: allCommits,
    });

const bodyPath = savePrBody(body);

if (existingPr) {
  updatePullRequest({
    number: existingPr.number,
    title: existingPr.title,
    bodyPath,
  });

  console.log('\n✅ push / PR更新が完了しました。');
  console.log(existingPr.url);
} else {
  const prUrl = createPullRequest({
    branch,
    baseBranch: comparisonBase,
    title: title.trim(),
    bodyPath,
  });

  console.log('\n✅ push / PR作成が完了しました。');
  console.log(prUrl);
}
