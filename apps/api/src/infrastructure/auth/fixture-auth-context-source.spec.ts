import { createAuthenticatedUser } from '../../test/factories/authenticated-user.factory';
import { FixtureAuthContextSource } from './fixture-auth-context-source';

describe('FixtureAuthContextSource', () => {
  it('credentialなしで生成した場合、標準fixtureの全項目を返すこと', async () => {
    const source = new FixtureAuthContextSource(createAuthenticatedUser());

    await expect(source.getAuthenticatedUser()).resolves.toEqual({
      internalUserId: 'user-1',
      externalAuthId: 'clerk-user-1',
      provider: 'clerk',
      displayName: 'Tsugu User',
      email: 'user@example.com',
    });
  });

  it('返却値を変更した場合、次回取得結果へ変更が残らないこと', async () => {
    const source = new FixtureAuthContextSource(createAuthenticatedUser());
    const first = await source.getAuthenticatedUser();

    Object.assign(first, { internalUserId: 'mutated' });

    await expect(source.getAuthenticatedUser()).resolves.toEqual({
      internalUserId: 'user-1',
      externalAuthId: 'clerk-user-1',
      provider: 'clerk',
      displayName: 'Tsugu User',
      email: 'user@example.com',
    });
  });

  it('externalAuthIdが空の場合、constructorで日本語のvalidation errorになること', () => {
    expect(
      () =>
        new FixtureAuthContextSource(
          createAuthenticatedUser({
            externalAuthId: '',
          }),
        ),
    ).toThrow('認証済みユーザーの外部認証IDは空でない文字列である必要があります。');
  });
});
