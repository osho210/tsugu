/**
 * MVPで利用する認証Provider。
 */
export type AuthProvider = 'clerk';

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
 *
 * @throws identityが安全な認証主体として扱えない場合。
 */
export function parseAuthenticatedUser(value: unknown): AuthenticatedUser {
  if (!isRecord(value)) {
    throw new Error('Authenticated user must be an object.');
  }

  const internalUserId = parseRequiredIdentifier(value.internalUserId, 'internal user id');
  const externalAuthId = parseRequiredIdentifier(value.externalAuthId, 'external auth id');

  if (value.provider !== 'clerk') {
    throw new Error('Authenticated user provider must be clerk.');
  }

  return {
    internalUserId,
    externalAuthId,
    provider: value.provider,
    displayName: parseOptionalText(value.displayName, 'display name'),
    email: parseOptionalText(value.email, 'email'),
  };
}

function parseRequiredIdentifier(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Authenticated user ${label} must be a non-empty string.`);
  }

  return value.trim();
}

function parseOptionalText(value: unknown, label: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`Authenticated user ${label} must be a string or null.`);
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
