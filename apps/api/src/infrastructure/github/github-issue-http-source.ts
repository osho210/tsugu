import {
  type GitHubIssue,
  type GitHubIssueQuery,
  type GitHubIssueSource,
  GitHubIssueSourceError,
  validateGitHubIssueQuery,
} from '../../application/github/github-issue-source';

/**
 * GitHub REST APIからIssueを取得するInfrastructure Adapter。
 */
export class GitHubIssueHttpSource implements GitHubIssueSource {
  /**
   * GitHub API設定を保持してAdapterを生成する。
   */
  constructor(
    private readonly token: string | undefined = process.env.GITHUB_TOKEN,
    private readonly timeoutMs = 5_000,
  ) {}

  /**
   * GitHub REST APIからIssueを取得してApplication contractへ正規化する。
   */
  async getIssue(query: GitHubIssueQuery): Promise<GitHubIssue> {
    validateGitHubIssueQuery(query);

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
        'GitHub Issue request failed or timed out.',
        { cause: error },
      );
    }

    if (response.status === 404 || response.status === 410) {
      throw new GitHubIssueSourceError('not-found', 'GitHub Issue was not found.');
    }

    if (response.status === 403 && (isHeaderRateLimitResponse(response) || (await isBodyRateLimitResponse(response)))) {
      throw new GitHubIssueSourceError('rate-limit', 'GitHub API rate limit was exceeded.');
    }

    if (response.status >= 500 || response.status === 429) {
      throw new GitHubIssueSourceError(
        response.status === 429 ? 'rate-limit' : 'temporary-failure',
        'GitHub API is temporarily unavailable.',
      );
    }

    if (!response.ok) {
      throw new GitHubIssueSourceError(
        'temporary-failure',
        `GitHub API returned HTTP ${response.status}.`,
      );
    }

    const payload = await readJsonBody(response);

    return parseGitHubIssueResponse(query, payload);
  }
}

async function readJsonBody(response: Response): Promise<unknown> {
  let body: string;

  try {
    body = await response.text();
  } catch (error) {
    throw new GitHubIssueSourceError(
      'temporary-failure',
      'GitHub Issue response body could not be read.',
      { cause: error },
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch (error) {
    throw new GitHubIssueSourceError(
      'invalid-response',
      'GitHub Issue response body was not valid JSON.',
      { cause: error },
    );
  }
}

function isHeaderRateLimitResponse(response: Response): boolean {
  return (
    response.headers.get('x-ratelimit-remaining') === '0' ||
    response.headers.has('retry-after')
  );
}

async function isBodyRateLimitResponse(response: Response): Promise<boolean> {
  let body: string;

  try {
    body = await response.clone().text();
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(body) as unknown;

    if (!isRecord(payload) || typeof payload.message !== 'string') {
      return false;
    }

    const message = payload.message.toLocaleLowerCase('en-US');
    return message.includes('secondary rate limit') || message.includes('abuse detection');
  } catch {
    return false;
  }
}

function parseGitHubIssueResponse(query: GitHubIssueQuery, value: unknown): GitHubIssue {
  if (!isRecord(value)) {
    throw invalidResponse('GitHub Issue response must be an object.');
  }

  const number = value.number;
  const title = value.title;
  const body = value.body;
  const htmlUrl = value.html_url;
  const labels = value.labels;

  if (number !== query.issueNumber || typeof title !== 'string') {
    throw invalidResponse('GitHub Issue response has invalid number or title.');
  }

  if (body !== null && typeof body !== 'string') {
    throw invalidResponse('GitHub Issue response body is invalid.');
  }

  if (!isGitHubHtmlUrl(htmlUrl) || !Array.isArray(labels)) {
    throw invalidResponse('GitHub Issue response URL or labels are invalid.');
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

function isGitHubHtmlUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com';
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

  throw invalidResponse('GitHub Issue response contains an invalid label.');
}

function invalidResponse(message: string): GitHubIssueSourceError {
  return new GitHubIssueSourceError('invalid-response', message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
