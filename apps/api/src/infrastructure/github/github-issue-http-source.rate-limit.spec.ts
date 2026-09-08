import { GitHubIssueSourceError } from '../../application/github/github-issue-source';
import { createGitHubIssueQuery } from '../../test/factories/github-issue.factory';
import { GitHubIssueHttpSource } from './github-issue-http-source';

describe('GitHubIssueHttpSource rate limit regression', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Retry-After付き403のbody読み取りが失敗してもrate-limitであること', async () => {
    const body = new ReadableStream({
      pull(controller) {
        controller.error(new Error('body stream failed'));
      },
    });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, {
        status: 403,
        headers: {
          'retry-after': '60',
          'x-ratelimit-remaining': '10',
        },
      }),
    );
    const source = new GitHubIssueHttpSource();

    const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

    expect(error.name).toBe('GitHubIssueSourceError');
    expect(error.kind).toBe('rate-limit');
    expect(error.message).toBe('GitHub APIのrate limitを超過しました。');
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
