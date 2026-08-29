import {
    confirm,
    input,
    select
} from '@inquirer/prompts';
import {
    execFileSync
} from 'node:child_process';
import {
    mkdirSync,
    readFileSync,
    writeFileSync
} from 'node:fs';
import {
    join
} from 'node:path';

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
    const remotes = runGit(['remote'])
        .split('\n')
        .filter(Boolean);

    if (!remotes.includes(remote)) {
        console.error(`remote "${remote}" が存在しません。`);
        process.exit(1);
    }
}

function ensureGitHubCli() {
    const version = tryCommand('gh', ['--version']);

    if (!version) {
        console.error('GitHub CLI が見つかりません。');
        console.error('gh をインストールしてから再実行してください。');
        process.exit(1);
    }

    const authStatus = tryCommand('gh', ['auth', 'status']);

    if (!authStatus) {
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
        console.warn(
            '\nremoteの最新情報を取得できませんでした。既存のremote refを使用します。\n',
        );
    }
}

function getUpstream() {
    return tryGit([
        'rev-parse',
        '--abbrev-ref',
        '--symbolic-full-name',
        '@{u}',
    ]);
}

function getDefaultRemoteBranch() {
    const symbolic = tryGit([
        'symbolic-ref',
        '--short',
        `refs/remotes/${remote}/HEAD`,
    ]);

    if (symbolic) {
        return symbolic;
    }

    if (
        tryGit([
            'rev-parse',
            '--verify',
            `refs/remotes/${remote}/main`,
        ])
    ) {
        return `${remote}/main`;
    }

    if (
        tryGit([
            'rev-parse',
            '--verify',
            `refs/remotes/${remote}/master`,
        ])
    ) {
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

function getCommitsFromUpstream(upstream) {
    return tryGit([
        'log',
        `${upstream}..HEAD`,
        '--pretty=format:%h %s',
    ]);
}

function getCommitsFromBase(baseBranch) {
    const mergeBase = tryGit([
        'merge-base',
        baseBranch,
        'HEAD',
    ]);

    if (!mergeBase) {
        console.error(
            `${baseBranch} と現在branchの親ブランチを特定できませんでした。`,
        );
        process.exit(1);
    }

    return tryGit([
        'log',
        `${mergeBase}..HEAD`,
        '--pretty=format:%h %s',
    ]);
}

function getAllBranchCommits(baseBranch) {
    const mergeBase = tryGit([
        'merge-base',
        baseBranch,
        'HEAD',
    ]);

    if (!mergeBase) {
        return '';
    }

    return tryGit([
        'log',
        `${mergeBase}..HEAD`,
        '--pretty=format:%h %s',
    ]);
}

function normalizeBaseBranch(base) {
    return base.replace(`${remote}/`, '');
}

function getPrTitle(description) {
    return description.trim();
}

function buildPrBody({
    description,
    commits,
}) {
    return `## 概要

${description}

## Commits

${commits
  .split('\n')
  .filter(Boolean)
  .map((commit) => `- ${commit}`)
  .join('\n')}
`;
}

function updateCommitsSection(body, commits) {
    const commitsSection = `## Commits

${commits
  .split('\n')
  .filter(Boolean)
  .map((commit) => `- ${commit}`)
  .join('\n')}`;

    const lines = body
        .replace(/\r\n/g, '\n')
        .split('\n');

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

    return `${result
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()}\n`;
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
    const result = tryCommand('gh', [
        'pr',
        'view',
        '--json',
        'number,url,title,body',
    ]);

    if (!result) {
        return null;
    }

    return JSON.parse(result);
}

function createPullRequest({
    branch,
    baseBranch,
    title,
    bodyPath,
}) {
    const base = normalizeBaseBranch(baseBranch);

    return runCommand(
        'gh',
        [
            'pr',
            'create',
            '--base',
            base,
            '--head',
            branch,
            '--title',
            title,
            '--body-file',
            bodyPath,
        ], {
            stdio: ['inherit', 'pipe', 'inherit'],
        },
    );
}

function updatePullRequest({
    number,
    title,
    bodyPath,
}) {
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
        ], {
            stdio: ['inherit', 'pipe', 'inherit'],
        },
    );
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

let description;
let title;

if (existingPr) {
    title = existingPr.title;

    console.log('\n既存PRを更新します。');
    console.log(existingPr.url);
    console.log(`PR Title: ${existingPr.title}`);
} else {
    description = await input({
        message: 'PRの変更概要を入力してください:',
        validate(value) {
            return (
                value.trim().length > 0 ||
                '変更概要を入力してください'
            );
        },
    });

    title = await input({
        message: 'PRタイトル:',
        default: description.trim(),
        validate(value) {
            return (
                value.trim().length > 0 ||
                'PRタイトルを入力してください'
            );
        },
    });
}

console.log('\n--------------------------------');
console.log('Push / Pull Request');
console.log('--------------------------------');
console.log(`Branch: ${branch}`);
console.log(`Base:   ${comparisonBase}`);

if (!existingPr) {
    console.log('\nDescription');
    console.log(description.trim());
}

console.log('\nCommits');
console.log(commits);

console.log('\nPR Title');
console.log(title.trim());

console.log('--------------------------------\n');

const shouldProceed = await confirm({
    message: existingPr ?
        'pushしてPRを更新しますか？' : 'pushしてPRを作成しますか？',
    default: true,
});

if (!shouldProceed) {
    console.log('処理をキャンセルしました。');
    process.exit(0);
}

/**
 * 1. Push
 */
if (hasUpstream) {
    execFileSync('git', ['push'], {
        stdio: 'inherit',
    });
} else {
    execFileSync(
        'git',
        ['push', '-u', remote, 'HEAD'], {
            stdio: 'inherit',
        },
    );
}

/**
 * 2. PRには「今回のpush」ではなく
 * branch全体のcommitを載せる。
 */
const allCommits =
    getAllBranchCommits(comparisonBase);

if (!allCommits) {
    console.error(
        'PR用のcommit一覧を取得できませんでした。',
    );
    process.exit(1);
}

/**
 * 3. PR本文生成
 */
const body = existingPr ?
    updateCommitsSection(
        existingPr.body,
        allCommits,
    ) :
    buildPrBody({
        description: description.trim(),
        commits: allCommits,
    });

const bodyPath = savePrBody(body);

/**
 * 4. PR作成・更新
 */
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