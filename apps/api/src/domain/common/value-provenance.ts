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
 * correctedAtはISO 8601 extended date-timeのうち、本contractが明示的に対応する
 * `YYYY-MM-DDTHH:mm:ss[.fraction](Z|±HH:mm)` profileを受理してUTC millisecond形式へ正規化する。
 * `24:00:00`は受理する一方、JavaScript Dateで安定して表現できないleap second (`:60`) は対象外とする。
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
    throw new Error('Human overrideのactorIdは空でない必要があります。');
  }

  if (reason.length === 0) {
    throw new Error('Human overrideのreasonは空でない必要があります。');
  }

  if (correctedAt === null) {
    throw new Error('Human overrideのcorrectedAtはサポート対象のISO timestampである必要があります。');
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
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const timezone = match[8];
  const isEndOfDay = hour === 24 && minute === 0 && second === 0 && !match[7];

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    (hour > 23 && !isEndOfDay) ||
    minute > 59 ||
    second > 59 ||
    !isValidTimezoneOffset(timezone)
  ) {
    return null;
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isValidTimezoneOffset(value: string | undefined): boolean {
  if (value === 'Z') {
    return true;
  }

  if (!value || value === '-00:00') {
    return false;
  }

  const hour = Number(value.slice(1, 3));
  const minute = Number(value.slice(4, 6));

  return minute <= 59 && (hour < 14 || (hour === 14 && minute === 0));
}
