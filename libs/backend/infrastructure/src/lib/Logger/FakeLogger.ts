import { Logger, LogLevel } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeLogger implements Logger {
  public logs: {
    level: LogLevel;
    message: string;
    data: unknown;
  }[] = [];

  debug(message: string, data: unknown): void {
    this.logs.push({
      level: 'debug',
      message,
      data,
    });
  }

  error(message: string, data: unknown): void {
    this.logs.push({
      level: 'error',
      message,
      data,
    });
  }

  info(message: string, data: unknown): void {
    this.logs.push({
      level: 'info',
      message,
      data,
    });
  }

  warn(message: string, data: unknown): void {
    this.logs.push({
      level: 'warn',
      message,
      data,
    });
  }

  log(message: string, data: unknown): void {
    this.logs.push({
      level: 'log',
      message,
      data,
    });
  }
}

export const tokenFakeLogger = createInjectionToken<FakeLogger>('FakeLogger', {
  useClass: FakeLogger,
});
