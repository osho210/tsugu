import {
  parseRequiredCapabilities,
  parseRequiredCapability,
} from './capability';

describe('RequiredCapability', () => {
  const validCapability = {
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
  };

  it('Domainをcanonical slugへ正規化する', () => {
    expect(parseRequiredCapability(validCapability)).toEqual({
      ...validCapability,
      domain: 'database',
    });
  });

  it('日本語Domainを保持して正規化する', () => {
    expect(
      parseRequiredCapability({
        ...validCapability,
        domain: ' データベース ',
      }).domain,
    ).toBe('データベース');
  });

  it('正規化後に空になるDomainを拒否する', () => {
    expect(() =>
      parseRequiredCapability({
        ...validCapability,
        domain: '!!!',
      }),
    ).toThrow('Required Capability domain must contain letters or numbers.');
  });

  it.each([0, 6])('Required Level %s を拒否する', (requiredLevel) => {
    expect(() =>
      parseRequiredCapability({
        ...validCapability,
        requiredLevel,
      }),
    ).toThrow('Required Capability level must be between 1 and 5.');
  });

  it.each([-0.1, 1.1, Number.NaN])('Confidence %s を拒否する', (confidence) => {
    expect(() =>
      parseRequiredCapability({
        ...validCapability,
        confidence,
      }),
    ).toThrow('Required Capability confidence must be between 0 and 1.');
  });

  it('配列以外のProvider出力を拒否する', () => {
    expect(() => parseRequiredCapabilities(validCapability)).toThrow(
      'Required Capability output must be an array.',
    );
  });
});
