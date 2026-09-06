import { ConsoleLogger } from '@nestjs/common';

import { AppLogger } from './app-logger';

describe('AppLogger', () => {
  it('redacts sensitive metadata before logging', () => {
    const logSpy = jest
      .spyOn(ConsoleLogger.prototype, 'log')
      .mockImplementation(() => undefined);
    const logger = new AppLogger();

    logger.log('user authenticated', {
      userId: 42,
      password: 'secret-value',
      nested: {
        accessToken: 'token-value',
      },
    });

    expect(logSpy).toHaveBeenCalledWith('user authenticated', {
      userId: 42,
      password: '[REDACTED]',
      nested: {
        accessToken: '[REDACTED]',
      },
    });

    logSpy.mockRestore();
  });
});
