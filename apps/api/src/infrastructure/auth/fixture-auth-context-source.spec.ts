import { FixtureAuthContextSource } from './fixture-auth-context-source';

describe('FixtureAuthContextSource', () => {
  const user = {
    internalUserId: 'user-1',
    externalAuthId: 'clerk-user-1',
    provider: 'clerk',
    displayName: 'Tsugu User',
    email: 'user@example.com',
  };

  it('credentialなしで認証済みUserを返す', async () => {
    const source = new FixtureAuthContextSource(user);

    await expect(source.getAuthenticatedUser()).resolves.toEqual(user);
  });

  it('呼出ごとに独立したidentity snapshotを返す', async () => {
    const source = new FixtureAuthContextSource(user);
    const first = await source.getAuthenticatedUser();

    Object.assign(first, { internalUserId: 'mutated' });

    await expect(source.getAuthenticatedUser()).resolves.toEqual(user);
  });

  it('不正identityをconstructorで拒否する', () => {
    expect(
      () =>
        new FixtureAuthContextSource({
          ...user,
          externalAuthId: '',
        }),
    ).toThrow('Authenticated user external auth id must be a non-empty string.');
  });
});
