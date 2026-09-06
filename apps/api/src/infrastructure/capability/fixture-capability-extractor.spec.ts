import { FixtureCapabilityExtractor } from './fixture-capability-extractor';

describe('FixtureCapabilityExtractor', () => {
  const fixture = [
    {
      domain: 'Database',
      role: 'Implementation',
      requiredLevel: 3,
      importance: 'required',
      confidence: 0.9,
      rationale: 'Schema変更が必要なため',
      evidence: [
        {
          source: 'issue-body',
          text: 'PostgreSQL schemaを変更する',
        },
      ],
    },
  ];

  it('credentialなしで検証済みCapabilityを返す', async () => {
    const extractor = new FixtureCapabilityExtractor(fixture);

    await expect(
      extractor.extract({
        title: 'DB schemaを変更する',
        body: null,
        labels: [],
      }),
    ).resolves.toEqual([
      {
        ...fixture[0],
        domain: 'database',
      },
    ]);
  });

  it('不正なfixtureをconstructorで拒否する', () => {
    expect(
      () =>
        new FixtureCapabilityExtractor([
          {
            ...fixture[0],
            requiredLevel: 6,
          },
        ]),
    ).toThrow('Required Capability level must be between 1 and 5.');
  });
});
