import type { RequiredCapability } from '../../domain/capability/capability';

/** RequiredCapabilityの標準fixtureを生成する。 */
export function createRequiredCapability(
  overrides: Partial<RequiredCapability> = {},
): RequiredCapability {
  return {
    domain: 'Database',
    role: 'Implementation',
    requiredLevel: 3,
    importance: 'required',
    confidence: 0.9,
    rationale: 'Schema変更とquery実装が必要なため',
    evidence: [
      {
        source: 'issue-body',
        text: 'PostgreSQL schemaを変更する',
      },
    ],
    ...overrides,
  };
}
