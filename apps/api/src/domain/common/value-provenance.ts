/**
 * 値がどの経路で得られたかを示すProvenance種別。
 */
type ValueProvenanceKind =
  | 'observed'
  | 'ai-calculated'
  | 'self-reported'
  | 'human-override';

/**
 * Human override前の元値とProvenance。
 */
type SourceValue<T> = {
  kind: Exclude<ValueProvenanceKind, 'human-override'>;
  value: T;
};

/**
 * Humanが明示的に修正した値と監査情報。
 */
export type HumanOverride<T> = {
  kind: 'human-override';
  value: T;
  actorId: string;
  correctedAt: string;
  reason: string;
};

/**
 * 元値を保持したまま任意のHuman overrideを重ねる値構造。
 */
export type ProvenancedValue<T> = {
  source: SourceValue<T>;
  override: HumanOverride<T> | null;
};

/**
 * Domainで利用する実効値と、その実効値のProvenance。
 */
export type EffectiveValue<T> = {
  value: T;
  kind: ValueProvenanceKind;
};

/**
 * Human overrideを監査可能な形で生成する。
 * correctedAtは有効なISO 8601 timestampを受理し、UTC millisecond形式へ正規化する。
 *
 * @throws actor、reason、correctedAtが監査情報として不正な場合。
 */
export function createHumanOverride<T>(input: {
  value: T;
  actorId: string;
  correctedAt: string;
  reason: string;
}): HumanOverride<T> {
  const actorId = input.actorId.trim();
  const reason = input.reason.trim();
  const correctedAt = normalizeIsoTimestamp(input.correctedAt);

  if (actorId.length === 0) {
    throw new Error('Human override actorId must not be empty.');
  }

  if (reason.length === 0) {
    throw new Error('Human override reason must not be empty.');
  }

  if (correctedAt === null) {
    throw new Error('Human override correctedAt must be a valid ISO timestamp.');
  }

  return {
    kind: 'human-override',
    value: input.value,
    actorId,
    correctedAt,
    reason,
  };
}

/**
 * Human overrideがあればその値を、なければ元値を実効値として返す。
 */
export function resolveEffectiveValue<T>(input: ProvenancedValue<T>): EffectiveValue<T> {
  if (input.override) {
    return {
      value: input.override.value,
      kind: input.override.kind,
    };
  }

  return {
    value: input.source.value,
    kind: input.source.kind,
  };
}

function normalizeIsoTimestamp(value: string): string | null {
  const isoTimestamp =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

  if (!isoTimestamp.test(value)) {
    return null;
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}
