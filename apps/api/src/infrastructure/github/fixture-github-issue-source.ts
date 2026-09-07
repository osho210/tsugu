import {
  type GitHubIssue,
  type GitHubIssueQuery,
  type GitHubIssueSource,
  GitHubIssueSourceError,
  validateGitHubIssueQuery,
} from '../../application/github/github-issue-source';

/**
 * 外部credentialなしでGitHub Issue取得を再現するFixture Adapter。
 */
export class FixtureGitHubIssueSource implements GitHubIssueSource {
  /**
   * Fixture一覧を保持して生成する。
   */
  constructor(private readonly issues: readonly GitHubIssue[]) {}

  /**
   * repository識別子とIssue番号が一致するfixtureを返す。
   */
  getIssue(query: GitHubIssueQuery): Promise<GitHubIssue> {
    try {
      validateGitHubIssueQuery(query);
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }

    const issue = this.issues.find(
      (candidate) =>
        candidate.owner === query.owner &&
        candidate.repository === query.repository &&
        candidate.issueNumber === query.issueNumber,
    );

    if (!issue) {
      return Promise.reject(
        new GitHubIssueSourceError('not-found', 'Fixture GitHub Issue was not found.'),
      );
    }

    return Promise.resolve(issue);
  }
}
