import { parseAuthenticatedUser } from './auth-context';

describe('AuthenticatedUser', () => {
  const validUser = {
    internalUserId: 'user-1',
    externalAuthId: 'clerk-user-1',
    provider: 'clerk',
    displayName: 'Tsugu User',
    email: 'user@example.com',
  };

  it('internal identityとexternal auth identityを分離して保持する', () => {
    expect(parseAuthenticatedUser(validUser)).toEqual(validUser);
  });

  it('identityの前後空白を正規化する', () => {
    expect(
      parseAuthenticatedUser({
        ...validUser,
        internalUserId: ' user-1 ',
        externalAuthId: ' clerk-user-1 ',
      }),
    ).toEqual(validUser);
  });

  it.each([
    ['internalUserId', '   ', 'internal user id'],
    ['externalAuthId', '', 'external auth id'],
  ])('空の%sを拒否する', (key, invalidValue, label) => {
    expect(() =>
      parseAuthenticatedUser({
        ...validUser,
        [key]: invalidValue,
      }),
    ).toThrow(`Authenticated user ${label} must be a non-empty string.`);
  });

  it('Clerk以外のproviderを拒否する', () => {
    expect(() =>
      parseAuthenticatedUser({
        ...validUser,
        provider: 'unknown',
      }),
    ).toThrow('Authenticated user provider must be clerk.');
  });

  it('空のoptional metadataをnullへ正規化する', () => {
    expect(
      parseAuthenticatedUser({
        ...validUser,
        displayName: ' ',
        email: null,
      }),
    ).toMatchObject({
      displayName: null,
      email: null,
    });
  });
});
