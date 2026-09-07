import {
  createHumanOverride,
  type ProvenancedValue,
  resolveEffectiveValue,
} from './value-provenance';

describe('ValueProvenance', () => {
  describe('effective value', () => {
    it('Human overrideがない場合、source valueとsource kindであること', () => {
      const value: ProvenancedValue<number> = {
        source: { kind: 'ai-calculated', value: 3 },
        override: null,
      };

      expect(resolveEffectiveValue(value)).toEqual({
        value: 3,
        kind: 'ai-calculated',
      });
    });

    it('Human overrideがある場合、sourceを保持しつつoverride valueとhuman-override kindであること', () => {
      const override = createHumanOverride({
        value: 4,
        actorId: 'user-1',
        correctedAt: '2026-09-07T00:00:00.000Z',
        reason: '実際の担当範囲を確認したため',
      });
      const value: ProvenancedValue<number> = {
        source: { kind: 'ai-calculated', value: 3 },
        override,
      };

      expect(value).toEqual({
        source: {
          kind: 'ai-calculated',
          value: 3,
        },
        override: {
          kind: 'human-override',
          value: 4,
          actorId: 'user-1',
          correctedAt: '2026-09-07T00:00:00.000Z',
          reason: '実際の担当範囲を確認したため',
        },
      });
      expect(resolveEffectiveValue(value)).toEqual({
        value: 4,
        kind: 'human-override',
      });
    });
  });

  describe('correctedAt', () => {
    it.each([
      ['2026-09-07T09:00:00+09:00', '2026-09-07T00:00:00.000Z'],
      ['2026-09-07T00:00:00Z', '2026-09-07T00:00:00.000Z'],
      ['2028-02-29T00:00:00Z', '2028-02-29T00:00:00.000Z'],
      ['2026-09-07T24:00:00Z', '2026-09-08T00:00:00.000Z'],
      ['2026-09-07T00:00:00+14:00', '2026-09-06T10:00:00.000Z'],
    ])('%sの場合、UTC canonical timestampが%sであること', (input, expected) => {
      expect(
        createHumanOverride({
          value: 4,
          actorId: 'user-1',
          correctedAt: input,
          reason: '確認済み',
        }).correctedAt,
      ).toBe(expected);
    });

    it.each([
      '2026-09-07',
      '2026-02-29T00:00:00Z',
      '2026-04-31T00:00:00Z',
      '2026-09-07T24:00:01Z',
      '2026-09-07T24:00:00.001Z',
      '2026-09-07T00:00:00+14:01',
      '2026-09-07T00:00:00+23:59',
      '2026-09-07T00:00:00-00:00',
      '2016-12-31T23:59:60Z',
    ])('%sの場合、サポート対象外timestampとして日本語のvalidation errorになること', (correctedAt) => {
      expect(() =>
        createHumanOverride({
          value: 4,
          actorId: 'user-1',
          correctedAt,
          reason: '確認済み',
        }),
      ).toThrow(
        'Human overrideのcorrectedAtはサポート対象のISO timestampである必要があります。',
      );
    });
  });

  describe('audit metadata', () => {
    it('reasonが空の場合、日本語のvalidation errorになること', () => {
      expect(() =>
        createHumanOverride({
          value: 4,
          actorId: 'user-1',
          correctedAt: '2026-09-07T00:00:00.000Z',
          reason: '   ',
        }),
      ).toThrow('Human overrideのreasonは空でない必要があります。');
    });
  });
});
