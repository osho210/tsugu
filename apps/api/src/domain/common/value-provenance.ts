/**
 * 値がどの経路で得られたかを示すProvenance種別。
 */
type ValueProvenanceKind =
  | 'observed'
  | 'ai-calculated'
  | 'self-reported'
  | 'human-override';

type SourceValue<T> = { kind: Exclude<ValueProvenanceKind, 'human-override'>; value: T };
export type HumanOverride<T> = { kind: 'human-override'; value: T; actorId: string; correctedAt: string; reason: string };
export type ProvenancedValue<T> = { source: SourceValue<T>; override: HumanOverride<T> | null };
export type EffectiveValue<T> = { value: T; kind: ValueProvenanceKind };

export function createHumanOverride<T>(input: { value: T; actorId: string; correctedAt: string; reason: string }): HumanOverride<T> {
  const actorId = input.actorId.trim();
  const reason = input.reason.trim();
  const correctedAt = normalizeIsoTimestamp(input.correctedAt);
  if (actorId.length === 0) throw new Error('Human override actorId must not be empty.');
  if (reason.length === 0) throw new Error('Human override reason must not be empty.');
  if (correctedAt === null) throw new Error('Human override correctedAt must be a valid ISO timestamp.');
  return { kind: 'human-override', value: input.value, actorId, correctedAt, reason };
}

export function resolveEffectiveValue<T>(input: ProvenancedValue<T>): EffectiveValue<T> {
  return input.override ? { value: input.override.value, kind: input.override.kind } : { value: input.source.value, kind: input.source.kind };
}

function normalizeIsoTimestamp(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const hour = Number(match[4]); const minute = Number(match[5]); const second = Number(match[6]); const timezone = match[8];
  const isEndOfDay = hour === 24 && minute === 0 && second === 0 && !match[7];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month) || (hour > 23 && !isEndOfDay) || minute > 59 || second > 59 || !isValidTimezoneOffset(timezone)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
function isLeapYear(year: number): boolean { return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0); }
function isValidTimezoneOffset(value: string | undefined): boolean {
  if (value === 'Z') return true;
  if (!value) return false;
  const hour = Number(value.slice(1, 3)); const minute = Number(value.slice(4, 6));
  return minute <= 59 && (hour < 14 || (hour === 14 && minute === 0));
}
