import { createRequiredCapability } from '../../test/factories/required-capability.factory';
import { FixtureCapabilityExtractor } from './fixture-capability-extractor';

describe('FixtureCapabilityExtractor', () => {
  const input = {
    title: 'DB schemaを変更する',
    body: null,
    labels: [],
  };

  it('credentialなしで生成した場合、canonicalize済みCapabilityの全項目を返すこと', async () => {
    const extractor = new FixtureCapabilityExtractor([createRequiredCapability()]);

    await expect(extractor.extract(input)).resolves.toEqual([
      {
        domain: 'database',
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
      },
    ]);
  });

  it('取得結果を変更した場合、次回取得結果へ変更が残らないこと', async () => {
    const extractor = new FixtureCapabilityExtractor([createRequiredCapability()]);
    const first = await extractor.extract(input);

    Object.assign(first[0] ?? {}, { domain: 'mutated' });

    await expect(extractor.extract(input)).resolves.toEqual([
      {
        domain: 'database',
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
      },
    ]);
  });

  it('Required Levelが6の場合、constructorで日本語のvalidation errorになること', () => {
    expect(
      () =>
        new FixtureCapabilityExtractor([
          {
            ...createRequiredCapability(),
            requiredLevel: 6,
          },
        ]),
    ).toThrow('Required CapabilityのLevelは1から5である必要があります。');
  });
});
