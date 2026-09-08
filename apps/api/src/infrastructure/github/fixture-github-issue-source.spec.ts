import {
  createGitHubIssue,
  createGitHubIssueQuery,
} from '../../test/factories/github-issue.factory';
import { FixtureGitHubIssueSource } from './fixture-github-issue-source';

describe('FixtureGitHubIssueSource', () => {
  it('一致するIssueがある場合、全項目を返すこと', async () => {
    const source = new FixtureGitHubIssueSource([createGitHubIssue()]);

    await expect(source.getIssue(createGitHubIssueQuery())).resolves.toEqual({
      owner: 'osho210',
      repository: 'tsugu',
      issueNumber: 40,
      title: 'GitHub Issue ingestionを実装する',
      body: 'Issueを取得する',
      labels: ['capability:api'],
      htmlUrl: 'https://github.com/osho210/tsugu/issues/40',
    });
  });

  it('repository識別子のcaseだけが異なる場合、同じIssueの全項目を返すこと', async () => {
    const source = new FixtureGitHubIssueSource([createGitHubIssue()]);

    await expect(
      source.getIssue(
        createGitHubIssueQuery({
          owner: 'Osho210',
          repository: 'Tsugu',
        }),
      ),
    ).resolves.toEqual({
      owner: 'osho210',
      repository: 'tsugu',
      issueNumber: 40,
      title: 'GitHub Issue ingestionを実装する',
      body: 'Issueを取得する',
      labels: ['capability:api'],
      htmlUrl: 'https://github.com/osho210/tsugu/issues/40',
    });
  });

  it('取得結果を変更した場合、次回取得結果へ変更が残らないこと', async () => {
    const source = new FixtureGitHubIssueSource([createGitHubIssue()]);
    const first = await source.getIssue(createGitHubIssueQuery());

    Object.assign(first, { title: 'mutated' });
    (first.labels as string[]).push('mutated');

    await expect(source.getIssue(createGitHubIssueQuery())).resolves.toEqual({
      owner: 'osho210',
      repository: 'tsugu',
      issueNumber: 40,
      title: 'GitHub Issue ingestionを実装する',
      body: 'Issueを取得する',
      labels: ['capability:api'],
      htmlUrl: 'https://github.com/osho210/tsugu/issues/40',
    });
  });

  it('一致するIssueがない場合、not-found errorであること', async () => {
    const source = new FixtureGitHubIssueSource([createGitHubIssue()]);

    await expect(
      source.getIssue(createGitHubIssueQuery({ issueNumber: 999 })),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'GitHubIssueSourceError',
        kind: 'not-found',
        message: 'Fixture GitHub Issueが見つかりませんでした。',
      }),
    );
  });

  it('ownerが不正な場合、外部アクセス前にinvalid-input errorであること', async () => {
    const source = new FixtureGitHubIssueSource([createGitHubIssue()]);

    await expect(
      source.getIssue(createGitHubIssueQuery({ owner: '../invalid' })),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'GitHubIssueSourceError',
        kind: 'invalid-input',
      }),
    );
  });
});
