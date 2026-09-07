import type { AuthenticatedUser } from '../../application/auth/auth-context';

/**
 * AuthenticatedUserの標準fixtureを生成する。
 * schema/contract変更時の追従点を一箇所に集約する。
 */
export function createAuthenticatedUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    internalUserId: 'user-1',
    externalAuthId: 'clerk-user-1',
    provider: 'clerk',
    displayName: 'Tsugu User',
    email: 'user@example.com',
    ...overrides,
  };
}
