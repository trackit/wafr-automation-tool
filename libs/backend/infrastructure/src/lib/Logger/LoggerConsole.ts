import { Logger } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class LoggerConsole implements Logger {
  debug(message: string, data: unknown): void {
    this.printLog({
      message,
      data,
      logFunction: console.debug,
    });
  }

  error(message: string, data: unknown): void {
    this.printLog({
      message,
      data,
      logFunction: console.error,
    });
  }

  info(message: string, data: unknown): void {
    this.printLog({
      message,
      data,
      logFunction: console.info,
    });
  }

  warn(message: string, data: unknown): void {
    this.printLog({
      message,
      data,
      logFunction: console.warn,
    });
  }

  log(message: string, data: unknown): void {
    this.printLog({
      message,
      data,
      logFunction: console.log,
    });
  }

  private transformErrorToJSON(obj: unknown): unknown {
    if (obj instanceof Error) {
      const errorProperties = Object.getOwnPropertyNames(obj);
      const errorJson: Record<string, unknown> = {};
      errorProperties.forEach((property) => {
        errorJson[property] = (obj as unknown as Record<string, unknown>)[
          property
        ];
      });
      return errorJson;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformErrorToJSON(item));
    }
    if (obj && typeof obj === 'object') {
      return Object.keys(obj).reduce<Record<string, unknown>>(
        (transformedObj, key) => {
          return {
            ...transformedObj,
            [key]: this.transformErrorToJSON(obj[key as keyof typeof obj]),
          };
        },
        {}
      );
    }

    return obj;
  }

  private printLog({
    message,
    data,
    logFunction,
  }: {
    message: string;
    data: unknown;
    logFunction: (input: unknown) => void;
  }): void {
    const log = {
      message,
      context: this.transformErrorToJSON(data),
    };

    logFunction(JSON.stringify(log));
  }
}

export const tokenLogger = createInjectionToken<Logger>('Logger', {
  useClass: LoggerConsole,
});
