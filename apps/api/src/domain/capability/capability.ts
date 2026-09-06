/**
 * Capabilityで担当する工程Role。
 */
export type CapabilityRole =
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
export type CapabilityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Taskに対するCapabilityの重要度。
 */
export type CapabilityImportance = 'required' | 'optional';

/**
 * Capability判定の根拠となった入力Evidence。
 */
export type CapabilityEvidence = {
  source: 'issue-title' | 'issue-body' | 'issue-label';
  text: string;
};

/**
 * Taskが要求するCapability。Domain × Role × Required Levelを保持する。
 */
export type RequiredCapability = {
  domain: string;
  role: CapabilityRole;
  requiredLevel: CapabilityLevel;
  importance: CapabilityImportance;
  confidence: number;
  rationale: string;
  evidence: readonly CapabilityEvidence[];
};

/**
 * 外部Semantic Providerから返されたRequired Capabilityを検証してDomain値へ変換する。
 *
 * @throws 入力がRequired Capability contractを満たさない場合。
 */
export function parseRequiredCapability(value: unknown): RequiredCapability {
  if (!isRecord(value)) {
    throw new Error('Required Capability must be an object.');
  }

  const domain = value.domain;
  const role = value.role;
  const requiredLevel = value.requiredLevel;
  const importance = value.importance;
  const confidence = value.confidence;
  const rationale = value.rationale;
  const evidence = value.evidence;

  if (typeof domain !== 'string' || domain.trim().length === 0) {
    throw new Error('Required Capability domain must be a non-empty string.');
  }

  if (!isCapabilityRole(role)) {
    throw new Error('Required Capability role is invalid.');
  }

  if (!isCapabilityLevel(requiredLevel)) {
    throw new Error('Required Capability level must be between 1 and 5.');
  }

  if (importance !== 'required' && importance !== 'optional') {
    throw new Error('Required Capability importance is invalid.');
  }

  if (
    typeof confidence !== 'number' ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new Error('Required Capability confidence must be between 0 and 1.');
  }

  if (typeof rationale !== 'string' || rationale.trim().length === 0) {
    throw new Error('Required Capability rationale must be a non-empty string.');
  }

  if (!Array.isArray(evidence)) {
    throw new Error('Required Capability evidence must be an array.');
  }

  return {
    domain: normalizeDomain(domain),
    role,
    requiredLevel,
    importance,
    confidence,
    rationale: rationale.trim(),
    evidence: evidence.map(parseCapabilityEvidence),
  };
}

/**
 * Semantic Providerの配列出力をまとめて検証する。
 */
export function parseRequiredCapabilities(value: unknown): readonly RequiredCapability[] {
  if (!Array.isArray(value)) {
    throw new Error('Required Capability output must be an array.');
  }

  return value.map(parseRequiredCapability);
}

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseCapabilityEvidence(value: unknown): CapabilityEvidence {
  if (!isRecord(value)) {
    throw new Error('Capability evidence must be an object.');
  }

  const source = value.source;
  const text = value.text;

  if (source !== 'issue-title' && source !== 'issue-body' && source !== 'issue-label') {
    throw new Error('Capability evidence source is invalid.');
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Capability evidence text must be a non-empty string.');
  }

  return { source, text: text.trim() };
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
