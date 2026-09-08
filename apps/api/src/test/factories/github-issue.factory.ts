import type {
  GitHubIssue,
  GitHubIssueQuery,
} from '../../application/github/github-issue-source';

/** GitHubIssueQueryの標準fixtureを生成する。 */
export function createGitHubIssueQuery(
  overrides: Partial<GitHubIssueQuery> = {},
): GitHubIssueQuery {
  return {
    owner: 'osho210',
    repository: 'tsugu',
    issueNumber: 40,
    ...overrides,
  };
}

/** GitHubIssueの標準fixtureを生成する。 */
export function createGitHubIssue(overrides: Partial<GitHubIssue> = {}): GitHubIssue {
  return {
    owner: 'osho210',
    repository: 'tsugu',
    issueNumber: 40,
    title: 'GitHub Issue ingestionを実装する',
    body: 'Issueを取得する',
    labels: ['capability:api'],
    htmlUrl: 'https://github.com/osho210/tsugu/issues/40',
    ...overrides,
  };
}
