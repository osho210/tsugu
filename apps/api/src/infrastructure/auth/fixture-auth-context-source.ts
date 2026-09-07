import {
  type AuthenticatedUser,
  type AuthContextSource,
  parseAuthenticatedUser,
} from '../../application/auth/auth-context';

/**
 * 外部Clerk credentialなしで認証済みUserを再現するFixture Source。
 */
export class FixtureAuthContextSource implements AuthContextSource {
  private readonly user: AuthenticatedUser;

  /**
   * Fixture identityを生成時にruntime validationする。
   */
  constructor(user: unknown) {
    this.user = parseAuthenticatedUser(user);
  }

  /**
   * 検証済みidentityの独立snapshotを返す。
   */
  getAuthenticatedUser(): Promise<AuthenticatedUser> {
    return Promise.resolve(parseAuthenticatedUser(this.user));
  }
}
