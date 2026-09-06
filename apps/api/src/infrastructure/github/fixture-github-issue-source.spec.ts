import { GitHubIssueSourceError } from '../../application/github/github-issue-source';
import { FixtureGitHubIssueSource } from './fixture-github-issue-source';

describe('FixtureGitHubIssueSource', () => {
  const issue = {
    owner: 'osho210',
    repository: 'tsugu',
    issueNumber: 40,
    title: 'GitHub Issue ingestionを実装する',
    body: 'Issueを取得する',
    labels: ['capability:api'],
    htmlUrl: 'https://github.com/osho210/tsugu/issues/40',
  };

  it('一致するIssueを返す', async () => {
    const source = new FixtureGitHubIssueSource([issue]);

    await expect(
      source.getIssue({
        owner: 'osho210',
        repository: 'tsugu',
        issueNumber: 40,
      }),
    ).resolves.toEqual(issue);
  });

  it('存在しないIssueをnot-foundとして返す', async () => {
    const source = new FixtureGitHubIssueSource([issue]);

    await expect(
      source.getIssue({
        owner: 'osho210',
        repository: 'tsugu',
        issueNumber: 999,
      }),
    ).rejects.toMatchObject<GitHubIssueSourceError>({
      kind: 'not-found',
    });
  });

  it('不正なrepository識別子を外部アクセス前に拒否する', async () => {
    const source = new FixtureGitHubIssueSource([issue]);

    await expect(
      source.getIssue({
        owner: '../invalid',
        repository: 'tsugu',
        issueNumber: 40,
      }),
    ).rejects.toMatchObject<GitHubIssueSourceError>({
      kind: 'invalid-input',
    });
  });
});
