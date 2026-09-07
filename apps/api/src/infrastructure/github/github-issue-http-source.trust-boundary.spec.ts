import { GitHubIssueSourceError } from '../../application/github/github-issue-source';
import { createGitHubIssueQuery } from '../../test/factories/github-issue.factory';
import { GitHubIssueHttpSource } from './github-issue-http-source';

describe('GitHubIssueHttpSource trust boundary', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('html_urlにuserinfoが含まれる場合、invalid-responseであること', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          number: 40,
          title: 'GitHub Issue ingestionを実装する',
          body: null,
          html_url: 'https://attacker:secret@github.com/osho210/tsugu/issues/40',
          labels: [],
        }),
        { status: 200 },
      ),
    );
    const source = new GitHubIssueHttpSource();

    const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

    expect(error.name).toBe('GitHubIssueSourceError');
    expect(error.kind).toBe('invalid-response');
    expect(error.message).toBe('GitHub Issue responseのURLまたはlabelsが不正です。');
  });

  it('GitHub API外へredirectされた場合、payloadを信用せずinvalid-responseであること', async () => {
    const response = new Response(
      JSON.stringify({
        number: 40,
        title: 'Forged issue',
        body: null,
        html_url: 'https://github.com/osho210/tsugu/issues/40',
        labels: [],
      }),
      { status: 200 },
    );
    Object.defineProperty(response, 'url', {
      value: 'https://example.com/repos/osho210/tsugu/issues/40',
    });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    const source = new GitHubIssueHttpSource();

    const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

    expect(error.name).toBe('GitHubIssueSourceError');
    expect(error.kind).toBe('invalid-response');
    expect(error.message).toBe('GitHub API redirect先URLが不正です。');
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
