import { ConsoleLogger, Injectable } from '@nestjs/common';

const sensitiveKeyPattern =
  /(?:authorization|cookie|credential|password|secret|token|api[-_]?key)/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const entries = Object.entries(value).map(([key, nestedValue]) => [
    key,
    sensitiveKeyPattern.test(key) ? '[REDACTED]' : redact(nestedValue),
  ]);

  return Object.fromEntries(entries);
}

/**
 * Application-wide structured logger with sensitive-field redaction.
 */
@Injectable()
export class AppLogger extends ConsoleLogger {
  constructor() {
    super({
      json: true,
    });
  }

  override log(message: unknown, ...optionalParams: unknown[]): void {
    super.log(redact(message), ...optionalParams.map((param) => redact(param)));
  }

  override error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(redact(message), ...optionalParams.map((param) => redact(param)));
  }

  override warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(redact(message), ...optionalParams.map((param) => redact(param)));
  }

  override debug(message: unknown, ...optionalParams: unknown[]): void {
    super.debug(redact(message), ...optionalParams.map((param) => redact(param)));
  }

  override verbose(message: unknown, ...optionalParams: unknown[]): void {
    super.verbose(redact(message), ...optionalParams.map((param) => redact(param)));
  }

  override fatal(message: unknown, ...optionalParams: unknown[]): void {
    super.fatal(redact(message), ...optionalParams.map((param) => redact(param)));
  }
}
