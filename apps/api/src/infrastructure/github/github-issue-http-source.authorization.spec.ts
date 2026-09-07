import { GitHubIssueSourceError } from '../../application/github/github-issue-source';
import { createGitHubIssueQuery } from '../../test/factories/github-issue.factory';
import { GitHubIssueHttpSource } from './github-issue-http-source';

describe('GitHubIssueHttpSource authorization classification', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rate limitではない403の場合、authentication-failureであること', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'The IP address is not permitted by this organization policy.',
        }),
        { status: 403 },
      ),
    );
    const source = new GitHubIssueHttpSource('restricted-token');

    const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

    expect(error.name).toBe('GitHubIssueSourceError');
    expect(error.kind).toBe('authentication-failure');
    expect(error.message).toBe('GitHub API tokenにIssue読み取り権限がありません。');
  });
});

async function captureSourceError(promise: Promise<unknown>): Promise<GitHubIssueSourceError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof GitHubIssueSourceError) {
      return error;
    }

    throw error;
  }

  throw new Error('GitHubIssueSourceErrorが発生する必要があります。');
}
