import { GitHubIssueSourceError } from '../../application/github/github-issue-source';
import { createGitHubIssueQuery } from '../../test/factories/github-issue.factory';
import { GitHubIssueHttpSource } from './github-issue-http-source';

describe('GitHubIssueHttpSource', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('success response', () => {
    it('token付きでIssueを取得した場合、全項目を正規化してAuthorization headerを付与すること', async () => {
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

      await expect(source.getIssue(createGitHubIssueQuery())).resolves.toEqual({
        owner: 'osho210',
        repository: 'tsugu',
        issueNumber: 40,
        title: 'GitHub Issue ingestionを実装する',
        body: 'Issueを取得する',
        labels: ['capability:api', 'mvp'],
        htmlUrl: 'https://github.com/osho210/tsugu/issues/40',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.lastCall?.[0]).toBe(
        'https://api.github.com/repos/osho210/tsugu/issues/40',
      );
      expect(fetchSpy.mock.lastCall?.[1]?.headers).toEqual({
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: 'Bearer test-token',
      });
    });

    it('repository rename後にAPIがcanonical URLへredirectした場合、canonical identityを返すこと', async () => {
      const response = new Response(
        JSON.stringify({
          number: 40,
          title: 'Renamed repository issue',
          body: null,
          html_url: 'https://github.com/new-owner/new-repository/issues/40',
          labels: [],
        }),
        { status: 200 },
      );
      Object.defineProperty(response, 'url', {
        value: 'https://api.github.com/repos/new-owner/new-repository/issues/40',
      });
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);
      const source = new GitHubIssueHttpSource();

      await expect(source.getIssue(createGitHubIssueQuery())).resolves.toEqual({
        owner: 'new-owner',
        repository: 'new-repository',
        issueNumber: 40,
        title: 'Renamed repository issue',
        body: null,
        labels: [],
        htmlUrl: 'https://github.com/new-owner/new-repository/issues/40',
      });
    });

    it('repository rename後にAPIがID形式URLへredirectした場合、repository_urlからcanonical identityを返すこと', async () => {
      const response = new Response(
        JSON.stringify({
          number: 40,
          title: 'Transferred repository issue',
          body: null,
          html_url: 'https://github.com/new-owner/new-repository/issues/40',
          repository_url: 'https://api.github.com/repos/new-owner/new-repository',
          labels: [],
        }),
        { status: 200 },
      );
      Object.defineProperty(response, 'url', {
        value: 'https://api.github.com/repositories/123456/issues/40',
      });
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);
      const source = new GitHubIssueHttpSource();

      await expect(source.getIssue(createGitHubIssueQuery())).resolves.toEqual({
        owner: 'new-owner',
        repository: 'new-repository',
        issueNumber: 40,
        title: 'Transferred repository issue',
        body: null,
        labels: [],
        htmlUrl: 'https://github.com/new-owner/new-repository/issues/40',
      });
    });
  });

  describe('status classification', () => {
    it('HTTP 401の場合、authentication-failureであること', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }));
      const source = new GitHubIssueHttpSource('invalid-token');

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('authentication-failure');
      expect(error.message).toBe('GitHub APIの認証に失敗しました。');
    });

    it.each([404, 410])('HTTP %sの場合、not-foundであること', async (status) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status }));
      const source = new GitHubIssueHttpSource();

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('not-found');
      expect(error.message).toBe('GitHub Issueが見つかりませんでした。');
    });

    it('Retry-After付き403の場合、rate-limitであること', async () => {
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

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('rate-limit');
      expect(error.message).toBe('GitHub APIのrate limitを超過しました。');
    });

    it('headerなしsecondary rate limit payloadの403の場合、rate-limitであること', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            message:
              'You have exceeded a secondary rate limit. Please wait a few minutes before you try again.',
          }),
          { status: 403 },
        ),
      );
      const source = new GitHubIssueHttpSource();

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('rate-limit');
      expect(error.message).toBe('GitHub APIのrate limitを超過しました。');
    });

    it('Issues read権限不足の403の場合、authentication-failureであること', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'Resource not accessible by personal access token',
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

    it('HTTP 404でbodyがある場合、body streamを破棄してnot-foundを返すこと', async () => {
      const cancel = jest.fn().mockResolvedValue(undefined);
      const body = new ReadableStream({
        pull() {},
        cancel,
      });
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 404 }));
      const source = new GitHubIssueHttpSource();

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.kind).toBe('not-found');
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('transport and response validation', () => {
    it('networkまたはtimeout failureの場合、temporary-failureであること', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('aborted', 'AbortError'));
      const source = new GitHubIssueHttpSource();

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('temporary-failure');
      expect(error.message).toBe('GitHub Issueの取得に失敗したかタイムアウトしました。');
    });

    it('success bodyがmalformed JSONの場合、invalid-responseであること', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{', { status: 200 }));
      const source = new GitHubIssueHttpSource();

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('invalid-response');
      expect(error.message).toBe('GitHub Issue response bodyが有効なJSONではありません。');
    });

    it('success bodyの読み取りに失敗した場合、temporary-failureであること', async () => {
      const body = new ReadableStream({
        start(controller) {
          controller.error(new Error('body stream failed'));
        },
      });
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }));
      const source = new GitHubIssueHttpSource();

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('temporary-failure');
      expect(error.message).toBe('GitHub Issue response bodyを読み取れませんでした。');
    });

    it('Issues APIがPull Request payloadを返した場合、invalid-responseであること', async () => {
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

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('invalid-response');
      expect(error.message).toBe('GitHub Issue responseがPull Requestを示しています。');
    });

    it.each([
      'javascript:alert(1)',
      'https://github.com/settings/tokens',
      'https://github.com:8443/osho210/tsugu/issues/40',
      'https://github.com/another/repository/issues/40',
      'https://github.com/osho210/tsugu/issues/41',
    ])('html_urlがIssue identityと一致しない%sの場合、invalid-responseであること', async (htmlUrl) => {
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

      const error = await captureSourceError(source.getIssue(createGitHubIssueQuery()));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('invalid-response');
      expect(error.message).toBe('GitHub Issue responseのURLまたはlabelsが不正です。');
    });
  });

  describe('query validation', () => {
    it('query containerがnullの場合、fetch前にinvalid-inputであること', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch');
      const source = new GitHubIssueHttpSource();

      const error = await captureSourceError(source.getIssue(null as never));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('invalid-input');
      expect(error.message).toBe('GitHub Issue queryはオブジェクトである必要があります。');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it.each(['_', '.foo', 'foo-', 'foo--bar', 'a'.repeat(40)])(
      'ownerが%sの場合、fetch前にinvalid-inputであること',
      async (owner) => {
        const fetchSpy = jest.spyOn(globalThis, 'fetch');
        const source = new GitHubIssueHttpSource();

        const error = await captureSourceError(
          source.getIssue(createGitHubIssueQuery({ owner })),
        );

        expect(error.name).toBe('GitHubIssueSourceError');
        expect(error.kind).toBe('invalid-input');
        expect(error.message).toBe(
          'GitHub ownerは1〜39文字の英数字またはハイフンで、先頭末尾のハイフンと連続ハイフンを含まない必要があります。',
        );
        expect(fetchSpy).not.toHaveBeenCalled();
      },
    );

    it('ownerがstring以外の場合、fetch前にinvalid-inputであること', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch');
      const source = new GitHubIssueHttpSource();
      const runtimeInput: unknown = {
        ...createGitHubIssueQuery(),
        owner: 123,
      };

      const error = await captureSourceError(source.getIssue(runtimeInput as never));

      expect(error.name).toBe('GitHubIssueSourceError');
      expect(error.kind).toBe('invalid-input');
      expect(fetchSpy).not.toHaveBeenCalled();
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
