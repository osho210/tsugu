import { GitHubIssueSourceError } from '../../application/github/github-issue-source';
import { createGitHubIssueQuery } from '../../test/factories/github-issue.factory';
import { GitHubIssueHttpSource } from './github-issue-http-source';

describe('GitHubIssueHttpSource retry and timeout behavior', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('HTTP 408の場合、temporary-failureであること', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 408 }));
    const source = new GitHubIssueHttpSource();

    const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

    expect(error.kind).toBe('temporary-failure');
    expect(error.message).toBe('GitHub APIが一時的に利用できません。');
  });

  it('redirect chain全体で同じtimeout signalを利用すること', async () => {
    const redirectResponse = new Response(null, {
      status: 301,
      headers: {
        location: 'https://api.github.com/repos/osho210/tsugu/issues/40',
      },
    });
    const finalResponse = new Response(
      JSON.stringify({
        number: 40,
        title: 'GitHub Issue ingestionを実装する',
        body: null,
        html_url: 'https://github.com/osho210/tsugu/issues/40',
        labels: [],
      }),
      { status: 200 },
    );
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(redirectResponse)
      .mockResolvedValueOnce(finalResponse);
    const source = new GitHubIssueHttpSource(undefined, 5_000);

    await expect(source.getIssue(createGitHubIssueQuery())).resolves.toEqual(
      expect.objectContaining({ issueNumber: 40 }),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0]?.[1]?.signal).toBe(fetchSpy.mock.calls[1]?.[1]?.signal);
  });
});

async function captureSourceError(promise: Promise<unknown>): Promise<GitHubIssueSourceError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(GitHubIssueSourceError);
    return error as GitHubIssueSourceError;
  }

  throw new Error('GitHubIssueSourceErrorがthrowされませんでした。');
}
