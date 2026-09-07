import type { RequiredCapability } from '../../domain/capability/capability';

/**
 * Required Capability抽出へ渡すIssue由来の入力。
 */
export type CapabilityExtractionInput = {
  title: string;
  body: string | null;
  labels: readonly string[];
};

/**
 * Semantic ProviderからRequired Capability候補を取得するPort。
 */
export type CapabilityExtractor = {
  extract(input: CapabilityExtractionInput): Promise<readonly RequiredCapability[]>;
};
