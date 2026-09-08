/**
 * MVPで利用する認証Provider。
 */
type AuthProvider = 'clerk';

/**
 * Applicationへ渡す認証済みUser identity。
 * Session tokenやcredentialは保持しない。
 */
export type AuthenticatedUser = {
  readonly internalUserId: string;
  readonly externalAuthId: string;
  readonly provider: AuthProvider;
  readonly displayName: string | null;
  readonly email: string | null;
};

/**
 * 現在の認証済みUserをApplicationへ提供するPort。
 */
export type AuthContextSource = {
  getAuthenticatedUser(): Promise<AuthenticatedUser>;
};

/**
 * 外部/Fixture identityを検証してApplication contractへ変換する。
 * 文字列trimなどHTTP request全体へ適用すべき正規化はPresentation境界で行う。
 *
 * @throws identityが安全な認証主体として扱えない場合。
 */
export function parseAuthenticatedUser(value: unknown): AuthenticatedUser {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('認証済みユーザーはオブジェクトである必要があります。');
  }

  const user = value as Record<string, unknown>;

  if (typeof user.internalUserId !== 'string' || user.internalUserId.trim().length === 0) {
    throw new Error('認証済みユーザーの内部ユーザーIDは空でない文字列である必要があります。');
  }

  if (typeof user.externalAuthId !== 'string' || user.externalAuthId.trim().length === 0) {
    throw new Error('認証済みユーザーの外部認証IDは空でない文字列である必要があります。');
  }

  if (user.provider !== 'clerk') {
    throw new Error('認証プロバイダーはclerkである必要があります。');
  }

  if (user.displayName !== null && user.displayName !== undefined && typeof user.displayName !== 'string') {
    throw new Error('表示名は文字列またはnullである必要があります。');
  }

  if (user.email !== null && user.email !== undefined && typeof user.email !== 'string') {
    throw new Error('メールアドレスは文字列またはnullである必要があります。');
  }

  return {
    internalUserId: user.internalUserId,
    externalAuthId: user.externalAuthId,
    provider: user.provider,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
  };
}
