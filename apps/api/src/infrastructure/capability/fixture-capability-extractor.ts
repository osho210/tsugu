import type {
  CapabilityExtractionInput,
  CapabilityExtractor,
} from '../../application/capability/capability-extractor';
import {
  parseRequiredCapabilities,
  type RequiredCapability,
} from '../../domain/capability/capability';

/**
 * 外部credentialなしでRequired Capability抽出を再現するFixture Provider。
 */
export class FixtureCapabilityExtractor implements CapabilityExtractor {
  private readonly fixture: readonly RequiredCapability[];

  /**
   * Fixture出力を生成時にruntime validationする。
   */
  constructor(fixture: unknown) {
    this.fixture = parseRequiredCapabilities(fixture);
  }

  /**
   * 設定済みfixtureを返す。入力はProvider差し替え時と同じcontractを維持する。
   */
  extract(input: CapabilityExtractionInput): Promise<readonly RequiredCapability[]> {
    void input;
    return Promise.resolve(this.fixture);
  }
}
