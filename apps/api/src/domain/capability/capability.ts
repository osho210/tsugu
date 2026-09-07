/**
 * Capabilityで担当する工程Role。
 */
type CapabilityRole =
  | 'Requirement Definition'
  | 'Specification'
  | 'Design'
  | 'Implementation'
  | 'Test'
  | 'Review'
  | 'Release'
  | 'Document Review'
  | 'Coordination'
  | 'Inquiry Response';

/**
 * Capabilityへ要求される難易度・自律度Level。
 */
type CapabilityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Taskに対するCapabilityの重要度。
 */
type CapabilityImportance = 'required' | 'optional';

/**
 * Capability判定の根拠となった入力Evidence。
 */
type CapabilityEvidence = {
  readonly source: 'issue-title' | 'issue-body' | 'issue-label';
  readonly text: string;
};

/**
 * Taskが要求するCapability。Domain × Role × Required Levelを保持する。
 */
export type RequiredCapability = {
  readonly domain: string;
  readonly role: CapabilityRole;
  readonly requiredLevel: CapabilityLevel;
  readonly importance: CapabilityImportance;
  readonly confidence: number;
  readonly rationale: string;
  readonly evidence: readonly CapabilityEvidence[];
};

/**
 * 外部Semantic Providerから返されたRequired Capabilityを検証してDomain値へ変換する。
 *
 * @throws 入力がRequired Capability contractを満たさない場合。
 */
export function parseRequiredCapability(value: unknown): RequiredCapability {
  if (!isRecord(value)) {
    throw new Error('Required Capabilityはオブジェクトである必要があります。');
  }

  const domain = value.domain;
  const role = value.role;
  const requiredLevel = value.requiredLevel;
  const importance = value.importance;
  const confidence = value.confidence;
  const rationale = value.rationale;
  const evidence = value.evidence;

  if (typeof domain !== 'string' || domain.trim().length === 0) {
    throw new Error('Required CapabilityのDomainは空でない文字列である必要があります。');
  }

  const normalizedDomain = normalizeDomain(domain);

  if (!/[\p{L}\p{N}]/u.test(normalizedDomain)) {
    throw new Error('Required CapabilityのDomainには文字または数字が必要です。');
  }

  if (!isCapabilityRole(role)) {
    throw new Error('Required CapabilityのRoleが不正です。');
  }

  if (!isCapabilityLevel(requiredLevel)) {
    throw new Error('Required CapabilityのLevelは1から5である必要があります。');
  }

  if (importance !== 'required' && importance !== 'optional') {
    throw new Error('Required CapabilityのImportanceが不正です。');
  }

  if (
    typeof confidence !== 'number' ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new Error('Required CapabilityのConfidenceは0から1である必要があります。');
  }

  if (typeof rationale !== 'string' || !hasVisibleText(rationale)) {
    throw new Error('Required CapabilityのRationaleには表示可能な文字が必要です。');
  }

  if (!Array.isArray(evidence)) {
    throw new Error('Required CapabilityのEvidenceは配列である必要があります。');
  }

  const parsedEvidence: CapabilityEvidence[] = [];

  for (let index = 0; index < evidence.length; index += 1) {
    if (!Object.hasOwn(evidence, index)) {
      throw new Error('Required CapabilityのEvidenceに欠損要素を含めることはできません。');
    }

    parsedEvidence.push(parseCapabilityEvidence(evidence[index]));
  }

  return {
    domain: normalizedDomain,
    role,
    requiredLevel,
    importance,
    confidence,
    rationale: rationale.trim(),
    evidence: parsedEvidence,
  };
}

/**
 * Semantic Providerの配列出力をまとめて検証する。
 */
export function parseRequiredCapabilities(value: unknown): readonly RequiredCapability[] {
  if (!Array.isArray(value)) {
    throw new Error('Required CapabilityのProvider出力は配列である必要があります。');
  }

  const capabilities: RequiredCapability[] = [];

  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) {
      throw new Error('Required CapabilityのProvider出力に欠損要素を含めることはできません。');
    }

    capabilities.push(parseRequiredCapability(value[index]));
  }

  return capabilities;
}

function normalizeDomain(value: string): string {
  const generatedSeparator = '\u0000';
  const caseFolded = Array.from(
    value.normalize('NFKC').replace(/\p{Default_Ignorable_Code_Point}/gu, '').trim(),
  )
    .map((character) => {
      if (character === 'ı') {
        return character;
      }

      return character.toLocaleUpperCase('und').toLocaleLowerCase('und');
    })
    .join('')
    .replaceAll('ς', 'σ');

  return caseFolded
    .replace(/\s*([+#./_-])\s*/gu, '$1')
    .replace(/[^\p{L}\p{M}\p{N}+#./_-]+/gu, generatedSeparator)
    .replace(new RegExp(`${generatedSeparator}+`, 'g'), generatedSeparator)
    .replace(new RegExp(`^${generatedSeparator}|${generatedSeparator}$`, 'g'), '')
    .replaceAll(generatedSeparator, '-');
}

function parseCapabilityEvidence(value: unknown): CapabilityEvidence {
  if (!isRecord(value)) {
    throw new Error('Capability Evidenceはオブジェクトである必要があります。');
  }

  const source = value.source;
  const text = value.text;

  if (source !== 'issue-title' && source !== 'issue-body' && source !== 'issue-label') {
    throw new Error('Capability EvidenceのSourceが不正です。');
  }

  if (typeof text !== 'string' || !hasVisibleText(text)) {
    throw new Error('Capability EvidenceのTextには表示可能な文字が必要です。');
  }

  return { source, text: text.trim() };
}

function hasVisibleText(value: string): boolean {
  return value
    .replace(/[\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cf}]/gu, '')
    .trim()
    .length > 0;
}

function isCapabilityRole(value: unknown): value is CapabilityRole {
  switch (value) {
    case 'Requirement Definition':
    case 'Specification':
    case 'Design':
    case 'Implementation':
    case 'Test':
    case 'Review':
    case 'Release':
    case 'Document Review':
    case 'Coordination':
    case 'Inquiry Response':
      return true;
    default:
      return false;
  }
}

function isCapabilityLevel(value: unknown): value is CapabilityLevel {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
