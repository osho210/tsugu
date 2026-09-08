import { createAuthenticatedUser } from '../../test/factories/authenticated-user.factory';
import { parseAuthenticatedUser } from './auth-context';

describe('AuthenticatedUser', () => {
  describe('有効なidentity', () => {
    it('有効なidentityの場合、全項目を保持したAuthenticatedUserであること', () => {
      const user = createAuthenticatedUser();

      expect(parseAuthenticatedUser(user)).toEqual({
        internalUserId: 'user-1',
        externalAuthId: 'clerk-user-1',
        provider: 'clerk',
        displayName: 'Tsugu User',
        email: 'user@example.com',
      });
    });

    it('optional metadataが未指定の場合、displayNameとemailがnullであること', () => {
      const user = createAuthenticatedUser({
        displayName: null,
        email: null,
      });

      expect(parseAuthenticatedUser(user)).toEqual({
        internalUserId: 'user-1',
        externalAuthId: 'clerk-user-1',
        provider: 'clerk',
        displayName: null,
        email: null,
      });
    });
  });

  describe('不正なidentity', () => {
    it.each([
      ['internalUserId', '   ', '認証済みユーザーの内部ユーザーIDは空でない文字列である必要があります。'],
      ['externalAuthId', '', '認証済みユーザーの外部認証IDは空でない文字列である必要があります。'],
    ])('%sが空の場合、日本語のvalidation errorになること', (key, invalidValue, message) => {
      expect(() =>
        parseAuthenticatedUser({
          ...createAuthenticatedUser(),
          [key]: invalidValue,
        }),
      ).toThrow(message);
    });

    it('providerがClerk以外の場合、日本語のvalidation errorになること', () => {
      expect(() =>
        parseAuthenticatedUser({
          ...createAuthenticatedUser(),
          provider: 'unknown',
        }),
      ).toThrow('認証プロバイダーはclerkである必要があります。');
    });

    it('displayNameが文字列またはnull以外の場合、日本語のvalidation errorになること', () => {
      expect(() =>
        parseAuthenticatedUser({
          ...createAuthenticatedUser(),
          displayName: 123,
        }),
      ).toThrow('表示名は文字列またはnullである必要があります。');
    });
  });
});
