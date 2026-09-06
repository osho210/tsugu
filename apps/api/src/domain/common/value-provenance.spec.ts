import {
  createHumanOverride,
  type ProvenancedValue,
  resolveEffectiveValue,
} from './value-provenance';

describe('ValueProvenance', () => {
  it('overrideがない場合はsource valueを返す', () => {
    const value: ProvenancedValue<number> = {
      source: {
        kind: 'ai-calculated',
        value: 3,
      },
      override: null,
    };

    expect(resolveEffectiveValue(value)).toEqual({
      value: 3,
      kind: 'ai-calculated',
    });
  });

  it('Human override後もsourceを保持したままeffective valueを切り替える', () => {
    const override = createHumanOverride({
      value: 4,
      actorId: 'user-1',
      correctedAt: '2026-09-07T00:00:00.000Z',
      reason: '実際の担当範囲を確認したため',
    });
    const value: ProvenancedValue<number> = {
      source: {
        kind: 'ai-calculated',
        value: 3,
      },
      override,
    };

    expect(value.source.value).toBe(3);
    expect(resolveEffectiveValue(value)).toEqual({
      value: 4,
      kind: 'human-override',
    });
  });

  it('空のoverride reasonを拒否する', () => {
    expect(() =>
      createHumanOverride({
        value: 4,
        actorId: 'user-1',
        correctedAt: '2026-09-07T00:00:00.000Z',
        reason: '   ',
      }),
    ).toThrow('Human override reason must not be empty.');
  });
});
