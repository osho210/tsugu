import { GitHubIssueSourceError } from '../../application/github/github-issue-source';
import { createGitHubIssueQuery } from '../../test/factories/github-issue.factory';
import { GitHubIssueHttpSource } from './github-issue-http-source';

describe('GitHubIssueHttpSource redirect / authentication boundary', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('SAML SSO authorizationが必要な403の場合、authentication-failureであること', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Resource protected by organization SAML enforcement',
        }),
        {
          status: 403,
          headers: {
            'x-github-sso': 'required; url=https://github.com/orgs/example/sso',
          },
        },
      ),
    );
    const source = new GitHubIssueHttpSource('saml-unapproved-token');

    const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

    expect(error.name).toBe('GitHubIssueSourceError');
    expect(error.kind).toBe('authentication-failure');
    expect(error.message).toBe('GitHub API tokenにIssue読み取り権限がありません。');
  });

  it('Issue transferでcanonical issue numberが変わった場合、redirect先identityを返すこと', async () => {
    const response = new Response(
      JSON.stringify({
        number: 84,
        title: 'Transferred issue',
        body: null,
        html_url: 'https://github.com/new-owner/new-repository/issues/84',
        labels: [],
      }),
      { status: 200 },
    );
    Object.defineProperty(response, 'url', {
      value: 'https://api.github.com/repos/new-owner/new-repository/issues/84',
    });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(createGitHubIssueQuery({ issueNumber: 40 }))).resolves.toEqual({
      owner: 'new-owner',
      repository: 'new-repository',
      issueNumber: 84,
      title: 'Transferred issue',
      body: null,
      labels: [],
      htmlUrl: 'https://github.com/new-owner/new-repository/issues/84',
    });
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
