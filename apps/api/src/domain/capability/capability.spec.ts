import { createRequiredCapability } from '../../test/factories/required-capability.factory';
import {
  parseRequiredCapabilities,
  parseRequiredCapability,
} from './capability';

describe('RequiredCapability', () => {
  describe('Domain canonicalization', () => {
    it('英字Domainの場合、小文字のcanonical keyであること', () => {
      expect(parseRequiredCapability(createRequiredCapability())).toEqual({
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
      });
    });

    it('Unicodeの大文字小文字違いの場合、同じcanonical keyであること', () => {
      const first = parseRequiredCapability(createRequiredCapability({ domain: 'Straße' })).domain;
      const second = parseRequiredCapability(createRequiredCapability({ domain: 'STRASSE' })).domain;

      expect(first).toBe('strasse');
      expect(second).toBe('strasse');
    });

    it('capital sharp Sを再parseした場合、同じcanonical keyであること', () => {
      const first = parseRequiredCapability(createRequiredCapability({ domain: 'ẞ' })).domain;
      const reparsed = parseRequiredCapability(createRequiredCapability({ domain: first })).domain;

      expect(first).toBe('ss');
      expect(reparsed).toBe('ss');
    });

    it('default-ignorable Unicodeを含む場合、除去後のcanonical keyであること', () => {
      const plain = parseRequiredCapability(createRequiredCapability({ domain: 'Java' })).domain;
      const decorated = parseRequiredCapability(
        createRequiredCapability({ domain: 'Java\uFE0F' }),
      ).domain;

      expect(plain).toBe('java');
      expect(decorated).toBe('java');
    });

    it('日本語Domainの場合、日本語を保持したcanonical keyであること', () => {
      expect(
        parseRequiredCapability(createRequiredCapability({ domain: ' データベース ' })).domain,
      ).toBe('データベース');
    });

    it.each([
      ['C', 'c'],
      ['C++', 'c++'],
      ['C#', 'c#'],
      ['Node.js', 'node.js'],
    ])('%sの場合、識別に必要なpunctuationを保持した%sであること', (domain, expected) => {
      expect(parseRequiredCapability(createRequiredCapability({ domain })).domain).toBe(expected);
    });

    it('punctuation周辺に空白がある場合、空白を除いたcanonical keyであること', () => {
      expect(parseRequiredCapability(createRequiredCapability({ domain: ' CI / CD ' })).domain).toBe(
        'ci/cd',
      );
    });

    it('Unicode combining markが異なる場合、別canonical keyであること', () => {
      const first = parseRequiredCapability(createRequiredCapability({ domain: 'का' })).domain;
      const second = parseRequiredCapability(createRequiredCapability({ domain: 'कि' })).domain;

      expect(first).toBe('का');
      expect(second).toBe('कि');
      expect(first).not.toBe(second);
    });
  });

  describe('validation', () => {
    it.each(['!!!', '+++', '###', '.', '/', '_'])(
      'Domainが%sだけの場合、日本語のvalidation errorになること',
      (domain) => {
        expect(() => parseRequiredCapability(createRequiredCapability({ domain }))).toThrow(
          'Required CapabilityのDomainには文字または数字が必要です。',
        );
      },
    );

    it.each([0, 6])('Required Levelが%sの場合、日本語のvalidation errorになること', (requiredLevel) => {
      expect(() =>
        parseRequiredCapability({
          ...createRequiredCapability(),
          requiredLevel,
        }),
      ).toThrow('Required CapabilityのLevelは1から5である必要があります。');
    });

    it.each([-0.1, 1.1, Number.NaN])(
      'Confidenceが%sの場合、日本語のvalidation errorになること',
      (confidence) => {
        expect(() => parseRequiredCapability(createRequiredCapability({ confidence }))).toThrow(
          'Required CapabilityのConfidenceは0から1である必要があります。',
        );
      },
    );

    it.each(['\u0000', '\u0085'])(
      'Rationaleがcontrol-onlyの%sの場合、日本語のvalidation errorになること',
      (rationale) => {
        expect(() => parseRequiredCapability(createRequiredCapability({ rationale }))).toThrow(
          'Required CapabilityのRationaleには表示可能な文字が必要です。',
        );
      },
    );

    it.each(['\u0000', '\u0085'])(
      'Evidence Textがcontrol-onlyの%sの場合、日本語のvalidation errorになること',
      (text) => {
        expect(() =>
          parseRequiredCapability(
            createRequiredCapability({
              evidence: [{ source: 'issue-body', text }],
            }),
          ),
        ).toThrow('Capability EvidenceのTextには表示可能な文字が必要です。');
      },
    );

    it('Evidence配列に欠損要素がある場合、日本語のvalidation errorになること', () => {
      expect(() =>
        parseRequiredCapability(
          createRequiredCapability({
            evidence: new Array(1),
          }),
        ),
      ).toThrow('Required CapabilityのEvidenceに欠損要素を含めることはできません。');
    });

    it('Provider出力が配列以外の場合、日本語のvalidation errorになること', () => {
      expect(() => parseRequiredCapabilities(createRequiredCapability())).toThrow(
        'Required CapabilityのProvider出力は配列である必要があります。',
      );
    });
  });
});
