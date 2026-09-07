import {
  type GitHubIssue,
  type GitHubIssueQuery,
  type GitHubIssueSource,
  GitHubIssueSourceError,
  validateGitHubIssueQuery,
} from '../../application/github/github-issue-source';

/** GitHub REST APIからIssueを取得するInfrastructure Adapter。 */
export class GitHubIssueHttpSource implements GitHubIssueSource {
  /** GitHub API設定を保持してAdapterを生成する。 */
  constructor(
    private readonly token: string | undefined = process.env.GITHUB_TOKEN,
    private readonly timeoutMs = 5_000,
  ) {}

  /** GitHub REST APIからIssueを取得してApplication contractへ正規化する。 */
  async getIssue(query: GitHubIssueQuery): Promise<GitHubIssue> {
    validateGitHubIssueQuery(query);
    validateGitHubToken(this.token);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response: Response;

    try {
      response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(query.owner)}/${encodeURIComponent(query.repository)}/issues/${query.issueNumber}`,
        {
          headers,
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );
    } catch (error) {
      throw new GitHubIssueSourceError(
        'temporary-failure',
        'GitHub Issueの取得に失敗したかタイムアウトしました。',
        { cause: error },
      );
    }

    if (response.status === 401) {
      await disposeResponseBody(response);
      throw new GitHubIssueSourceError(
        'authentication-failure',
        'GitHub APIの認証に失敗しました。',
      );
    }

    if (response.status === 404 || response.status === 410) {
      await disposeResponseBody(response);
      throw new GitHubIssueSourceError('not-found', 'GitHub Issueが見つかりませんでした。');
    }

    if (response.status === 403) {
      const errorMessage = await readErrorMessage(response);

      if (isHeaderRateLimitResponse(response) || isRateLimitMessage(errorMessage)) {
        await disposeResponseBody(response);
        throw new GitHubIssueSourceError('rate-limit', 'GitHub APIのrate limitを超過しました。');
      }

      await disposeResponseBody(response);
      throw new GitHubIssueSourceError(
        'authentication-failure',
        'GitHub API tokenにIssue読み取り権限がありません。',
      );
    }

    if (response.status >= 500 || response.status === 429) {
      await disposeResponseBody(response);
      throw new GitHubIssueSourceError(
        response.status === 429 ? 'rate-limit' : 'temporary-failure',
        response.status === 429
          ? 'GitHub APIのrate limitを超過しました。'
          : 'GitHub APIが一時的に利用できません。',
      );
    }

    if (!response.ok) {
      await disposeResponseBody(response);
      throw new GitHubIssueSourceError(
        'temporary-failure',
        `GitHub APIがHTTP ${response.status}を返しました。`,
      );
    }

    const payload = await readJsonBody(response);
    const identity = resolveResponseIdentity(response, query, payload);

    return parseGitHubIssueResponse(identity, payload);
  }
}

function validateGitHubToken(token: string | undefined): void {
  if (token === undefined || token.length === 0) {
    return;
  }

  if (/\p{Cc}/u.test(token)) {
    throw new GitHubIssueSourceError(
      'authentication-failure',
      'GitHub API tokenの形式が不正です。',
    );
  }
}

async function readJsonBody(response: Response): Promise<unknown> {
  let body: string;

  try {
    body = await response.text();
  } catch (error) {
    throw new GitHubIssueSourceError(
      'temporary-failure',
      'GitHub Issue response bodyを読み取れませんでした。',
      { cause: error },
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch (error) {
    throw new GitHubIssueSourceError(
      'invalid-response',
      'GitHub Issue response bodyが有効なJSONではありません。',
      { cause: error },
    );
  }
}

async function readErrorMessage(response: Response): Promise<string | null> {
  let body: string;

  try {
    body = await response.clone().text();
  } catch (error) {
    throw new GitHubIssueSourceError(
      'temporary-failure',
      'GitHub API error response bodyを読み取れませんでした。',
      { cause: error },
    );
  }

  try {
    const payload = JSON.parse(body) as unknown;
    return isRecord(payload) && typeof payload.message === 'string' ? payload.message : null;
  } catch {
    return null;
  }
}

async function disposeResponseBody(response: Response): Promise<void> {
  if (response.body === null || response.bodyUsed) {
    return;
  }

  try {
    await response.body.cancel();
  } catch {
    // status errorを返すためのbest-effort cleanup。cleanup失敗でerror分類を変えない。
  }
}

function isHeaderRateLimitResponse(response: Response): boolean {
  return (
    response.headers.get('x-ratelimit-remaining') === '0' ||
    response.headers.has('retry-after')
  );
}

function isRateLimitMessage(message: string | null): boolean {
  if (message === null) {
    return false;
  }

  const normalized = message.toLocaleLowerCase('en-US');
  return normalized.includes('secondary rate limit') || normalized.includes('abuse detection');
}

function resolveResponseIdentity(
  response: Response,
  query: GitHubIssueQuery,
  payload: unknown,
): GitHubIssueQuery {
  if (response.url.length === 0) {
    return query;
  }

  let url: URL;

  try {
    url = new URL(response.url);
  } catch {
    throw invalidResponse('GitHub API redirect先URLが不正です。');
  }

  if (
    url.origin !== 'https://api.github.com' ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw invalidResponse('GitHub API redirect先URLが不正です。');
  }

  const repositoryPathMatch = /^\/repos\/([^/]+)\/([^/]+)\/issues\/(\d+)$/.exec(url.pathname);

  if (repositoryPathMatch !== null) {
    const canonicalIssueNumber = parseCanonicalIssueNumber(repositoryPathMatch[3]);
    return validateRedirectIdentity(
      repositoryPathMatch[1],
      repositoryPathMatch[2],
      canonicalIssueNumber,
    );
  }

  const repositoryIdPathMatch = /^\/repositories\/(\d+)\/issues\/(\d+)$/.exec(url.pathname);

  if (repositoryIdPathMatch === null) {
    throw invalidResponse('GitHub API redirect先URLがIssue endpointを示していません。');
  }

  const canonicalIssueNumber = parseCanonicalIssueNumber(repositoryIdPathMatch[2]);
  return resolveIdentityFromRepositoryUrl(payload, canonicalIssueNumber);
}

function parseCanonicalIssueNumber(value: string): number {
  const issueNumber = Number(value);

  if (!Number.isSafeInteger(issueNumber) || issueNumber <= 0) {
    throw invalidResponse('GitHub API redirect先のIssue番号が不正です。');
  }

  return issueNumber;
}

function resolveIdentityFromRepositoryUrl(
  payload: unknown,
  issueNumber: number,
): GitHubIssueQuery {
  if (!isRecord(payload) || typeof payload.repository_url !== 'string') {
    throw invalidResponse('GitHub Issue responseのrepository_urlが不正です。');
  }

  let repositoryUrl: URL;

  try {
    repositoryUrl = new URL(payload.repository_url);
  } catch {
    throw invalidResponse('GitHub Issue responseのrepository_urlが不正です。');
  }

  const match = /^\/repos\/([^/]+)\/([^/]+)$/.exec(repositoryUrl.pathname);

  if (
    repositoryUrl.origin !== 'https://api.github.com' ||
    repositoryUrl.username.length > 0 ||
    repositoryUrl.password.length > 0 ||
    repositoryUrl.search.length > 0 ||
    repositoryUrl.hash.length > 0 ||
    match === null
  ) {
    throw invalidResponse('GitHub Issue responseのrepository_urlが不正です。');
  }

  return validateRedirectIdentity(match[1], match[2], issueNumber);
}

function validateRedirectIdentity(
  encodedOwner: string,
  encodedRepository: string,
  issueNumber: number,
): GitHubIssueQuery {
  let identity: GitHubIssueQuery;

  try {
    identity = {
      owner: decodeURIComponent(encodedOwner),
      repository: decodeURIComponent(encodedRepository),
      issueNumber,
    };
  } catch {
    throw invalidResponse('GitHub API redirect先のrepository identityが不正です。');
  }

  try {
    validateGitHubIssueQuery(identity);
  } catch (error) {
    if (error instanceof GitHubIssueSourceError && error.kind === 'invalid-input') {
      throw invalidResponse('GitHub API redirect先のrepository identityが不正です。');
    }
    throw error;
  }

  return identity;
}

function parseGitHubIssueResponse(query: GitHubIssueQuery, value: unknown): GitHubIssue {
  if (!isRecord(value)) {
    throw invalidResponse('GitHub Issue responseはオブジェクトである必要があります。');
  }

  if ('pull_request' in value) {
    throw invalidResponse('GitHub Issue responseがPull Requestを示しています。');
  }

  const number = value.number;
  const title = value.title;
  const body = value.body;
  const htmlUrl = value.html_url;
  const labels = value.labels;

  if (number !== query.issueNumber || typeof title !== 'string') {
    throw invalidResponse('GitHub Issue responseのnumberまたはtitleが不正です。');
  }

  if (body !== null && typeof body !== 'string') {
    throw invalidResponse('GitHub Issue responseのbodyが不正です。');
  }

  if (!isGitHubIssueHtmlUrl(htmlUrl, query) || !Array.isArray(labels)) {
    throw invalidResponse('GitHub Issue responseのURLまたはlabelsが不正です。');
  }

  return {
    owner: query.owner,
    repository: query.repository,
    issueNumber: number,
    title,
    body,
    labels: labels.map(parseLabel),
    htmlUrl,
  };
}

function isGitHubIssueHtmlUrl(value: unknown, query: GitHubIssueQuery): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const url = new URL(value);
    const expectedPath = `/${query.owner}/${query.repository}/issues/${query.issueNumber}`;
    return (
      url.origin === 'https://github.com' &&
      url.username.length === 0 &&
      url.password.length === 0 &&
      url.pathname.toLocaleLowerCase('en-US') === expectedPath.toLocaleLowerCase('en-US') &&
      url.search.length === 0 &&
      url.hash.length === 0
    );
  } catch {
    return false;
  }
}

function parseLabel(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (isRecord(value) && typeof value.name === 'string') {
    return value.name;
  }

  throw invalidResponse('GitHub Issue responseに不正なlabelが含まれています。');
}

function invalidResponse(message: string): GitHubIssueSourceError {
  return new GitHubIssueSourceError('invalid-response', message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
