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

  it('403 response bodyの読取に失敗した場合、temporary-failureであること', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new Error('connection reset'));
      },
    });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 403 }));
    const source = new GitHubIssueHttpSource('restricted-token');

    const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

    expect(error.name).toBe('GitHubIssueSourceError');
    expect(error.kind).toBe('temporary-failure');
    expect(error.message).toBe('GitHub API error response bodyを読み取れませんでした。');
  });

  it('tokenに制御文字が含まれる場合、credentialをcauseへ保持せずauthentication-failureであること', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const source = new GitHubIssueHttpSource('secret-token\nattacker');

    const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(error.name).toBe('GitHubIssueSourceError');
    expect(error.kind).toBe('authentication-failure');
    expect(error.message).toBe('GitHub API tokenの形式が不正です。');
    expect(error.cause).toBeUndefined();
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
