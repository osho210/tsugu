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

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.lastCall;
    expect(call?.[0]).toBe('https://api.github.com/repos/osho210/tsugu/issues/40');
    expect(call?.[1]?.headers).toEqual({
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: 'Bearer test-token',
    });
  });

  it('HTTP 401をauthentication-failureへ分類する', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }));
    const source = new GitHubIssueHttpSource('invalid-token');

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'authentication-failure',
    });
  });

  it.each([404, 410])('HTTP %sをnot-foundへ分類する', async (status) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status }));
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'not-found',
    });
  });

  it('Retry-After付きsecondary rate limitの403をrate-limitへ分類する', async () => {
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

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'rate-limit',
    });
  });

  it('headerなしsecondary rate limit payloadの403をrate-limitへ分類する', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'You have exceeded a secondary rate limit. Please wait a few minutes before you try again.',
        }),
        { status: 403 },
      ),
    );
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'rate-limit',
    });
  });

  it('network/timeout failureをtemporary-failureへ分類する', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('aborted', 'AbortError'));
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'temporary-failure',
    });
  });

  it('malformed JSONをinvalid-responseへ分類する', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{', { status: 200 }));
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
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

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'temporary-failure',
    });
  });

  it('query containerがnullなら外部アクセス前にinvalid-inputとして拒否する', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(null as never)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'invalid-input',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('dot segmentを外部アクセス前にinvalid-inputとして拒否する', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const source = new GitHubIssueHttpSource();

    await expect(
      source.getIssue({
        ...query,
        owner: '..',
      }),
    ).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'invalid-input',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('non-string repository識別子を外部アクセス前にinvalid-inputとして拒否する', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const source = new GitHubIssueHttpSource();
    const runtimeInput: unknown = {
      ...query,
      owner: 123,
    };

    await expect(source.getIssue(runtimeInput as never)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'invalid-input',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('Issues APIが返したPull Requestをinvalid-responseとして拒否する', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          number: 40,
          title: 'PR disguised as issue',
          body: null,
          html_url: 'https://github.com/osho210/tsugu/issues/40',
          labels: [],
          pull_request: { url: 'https://api.github.com/repos/osho210/tsugu/pulls/40' },
        }),
        { status: 200 },
      ),
    );
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'invalid-response',
    });
  });

  it.each([
    'javascript:alert(1)',
    'https://github.com/settings/tokens',
    'https://github.com/another/repository/issues/40',
    'https://github.com/osho210/tsugu/issues/41',
  ])('Issue identityと一致しないhtml_url %s をinvalid-responseとして拒否する', async (htmlUrl) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          number: 40,
          title: 'GitHub Issue ingestionを実装する',
          body: null,
          html_url: htmlUrl,
          labels: [],
        }),
        { status: 200 },
      ),
    );
    const source = new GitHubIssueHttpSource();

    await expect(source.getIssue(query)).rejects.toMatchObject({
      name: 'GitHubIssueSourceError',
      kind: 'invalid-response',
    });
  });
});
