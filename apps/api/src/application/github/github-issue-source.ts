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
  | 'authentication-failure'
  | 'temporary-failure'
  | 'invalid-response';

/**
 * GitHub Issue sourceが返す分類済みError。
 */
export class GitHubIssueSourceError extends Error {
  /** Error分類を保持して生成する。 */
  constructor(
    readonly kind: GitHubIssueSourceErrorKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'GitHubIssueSourceError';
  }
}

/** GitHub Issueを取得するApplication Port。 */
export type GitHubIssueSource = {
  getIssue(query: GitHubIssueQuery): Promise<GitHubIssue>;
};

/**
 * GitHub Issue queryを外部アクセス前に検証する。
 *
 * @throws queryがGitHub repository/Issue識別子として不正な場合。
 */
export function validateGitHubIssueQuery(query: GitHubIssueQuery): void {
  if (typeof query !== 'object' || query === null) {
    throw new GitHubIssueSourceError('invalid-input', 'GitHub Issue queryはオブジェクトである必要があります。');
  }

  const ownerPattern = /^(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
  const repositoryPattern = /^(?!\.{1,2}$)[A-Za-z0-9_.-]+$/;

  if (typeof query.owner !== 'string' || !ownerPattern.test(query.owner)) {
    throw new GitHubIssueSourceError(
      'invalid-input',
      'GitHub ownerは1〜39文字の英数字またはハイフンで、先頭末尾のハイフンと連続ハイフンを含まない必要があります。',
    );
  }

  if (
    typeof query.repository !== 'string' ||
    query.repository.length > 100 ||
    !repositoryPattern.test(query.repository)
  ) {
    throw new GitHubIssueSourceError(
      'invalid-input',
      'GitHub repository名は1〜100文字の英数字、ピリオド、ハイフン、アンダースコアである必要があります。',
    );
  }

  if (!Number.isSafeInteger(query.issueNumber) || query.issueNumber <= 0) {
    throw new GitHubIssueSourceError(
      'invalid-input',
      'GitHub Issue番号は1以上の安全な整数である必要があります。',
    );
  }
}
