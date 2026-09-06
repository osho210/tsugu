import { GitHubIssueSourceError } from '../../application/github/github-issue-source';
import { GitHubIssueHttpSource } from './github-issue-http-source';

describe('GitHubIssueHttpSource', () => {
  const query = {
    owner: 'osho210',
    repository: 'tsugu',
    issueNumber: 40,
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GitHub responseを正規化しAuthorization headerを付与する', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          number: 40,
          title: 'GitHub Issue ingestionを実装する',
          body: 'Issueを取得する',
          html_url: 'https://github.com/osho210/tsugu/issues/40',
          labels: [{ name: 'capability:api' }, 'mvp'],
        }),
        { status: 200 },
      ),
    );
    const source = new GitHubIssueHttpSource('test-token');

    await expect(source.getIssue(query)).resolves.toEqual({
      ...query,
      title: 'GitHub Issue ingestionを実装する',
      body: 'Issueを取得する',
      htmlUrl: 'https://github.com/osho210/tsugu/issues/40',
      labels: ['capability:api', 'mvp'],
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.github.com/repos/osho210/tsugu/issues/40',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('404をnot-foundへ分類する', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject<GitHubIssueSourceError>({
      kind: 'not-found',
    });
  });

  it('secondary rate limitの403をrate-limitへ分類する', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 403,
        headers: {
          'retry-after': '60',
          'x-ratelimit-remaining': '10',
        },
      }),
    );
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject<GitHubIssueSourceError>({
      kind: 'rate-limit',
    });
  });

  it('network/timeout failureをtemporary-failureへ分類する', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('aborted', 'AbortError'));
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject<GitHubIssueSourceError>({
      kind: 'temporary-failure',
    });
  });

  it('malformed JSONをinvalid-responseへ分類する', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{', { status: 200 }));
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject<GitHubIssueSourceError>({
      kind: 'invalid-response',
    });
  });

  it('response body read failureをtemporary-failureへ分類する', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new Error('body stream failed'));
      },
    });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }));
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject<GitHubIssueSourceError>({
      kind: 'temporary-failure',
    });
  });

  it('dot segmentを外部アクセス前にinvalid-inputとして拒否する', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const source = new GitHubIssueHttpSource();

    await expect(
      source.getIssue({
        ...query,
        owner: '..',
      }),
    ).rejects.toMatchObject<GitHubIssueSourceError>({
      kind: 'invalid-input',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
