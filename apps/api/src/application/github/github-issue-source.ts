/**
 * GitHub Issue取得に必要なrepository識別子。
 */
export type GitHubIssueQuery = {
  owner: string;
  repository: string;
  issueNumber: number;
};

/**
 * Applicationへ渡す正規化済みGitHub Issue。
 */
export type GitHubIssue = {
  owner: string;
  repository: string;
  issueNumber: number;
  title: string;
  body: string | null;
  labels: readonly string[];
  htmlUrl: string;
};

/**
 * GitHub Issue取得失敗をApplicationで安定して扱うための分類。
 */
export type GitHubIssueSourceErrorKind =
  | 'invalid-input'
  | 'not-found'
  | 'rate-limit'
  | 'temporary-failure'
  | 'invalid-response';

/**
 * GitHub Issue sourceが返す分類済みError。
 */
export class GitHubIssueSourceError extends Error {
  /**
   * Error分類を保持して生成する。
   */
  constructor(
    readonly kind: GitHubIssueSourceErrorKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'GitHubIssueSourceError';
  }
}

/**
 * GitHub Issueを取得するApplication Port。
 */
export type GitHubIssueSource = {
  getIssue(query: GitHubIssueQuery): Promise<GitHubIssue>;
};

/**
 * GitHub Issue queryを外部アクセス前に検証する。
 *
 * @throws queryがGitHub repository/Issue識別子として不正な場合。
 */
export function validateGitHubIssueQuery(query: GitHubIssueQuery): void {
  const repositoryPart = /^[A-Za-z0-9_.-]+$/;

  if (!repositoryPart.test(query.owner) || !repositoryPart.test(query.repository)) {
    throw new GitHubIssueSourceError(
      'invalid-input',
      'GitHub owner and repository must contain only valid repository identifier characters.',
    );
  }

  if (!Number.isSafeInteger(query.issueNumber) || query.issueNumber <= 0) {
    throw new GitHubIssueSourceError(
      'invalid-input',
      'GitHub issue number must be a positive integer.',
    );
  }
}
