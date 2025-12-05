import { type Logger } from '@backend/ports';
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

  private transformErrorToJSON(
    obj: unknown,
    seen: WeakSet<object> = new WeakSet(),
  ): unknown {
    if (obj && typeof obj === 'object') {
      const ref = obj as object;
      if (seen.has(ref)) return '[Circular]';
      seen.add(ref);

      if (obj instanceof Error) {
        const errorJson: Record<string, unknown> = {};
        for (const property of Object.getOwnPropertyNames(obj)) {
          const value = (obj as unknown as Record<string, unknown>)[property];
          errorJson[property] = this.transformErrorToJSON(value, seen);
        }
        return errorJson;
      }

      if (Array.isArray(obj)) {
        return (obj as unknown[]).map((item) =>
          this.transformErrorToJSON(item, seen),
        );
      }

      return Object.keys(obj as Record<string, unknown>).reduce<
        Record<string, unknown>
      >((acc, key) => {
        acc[key] = this.transformErrorToJSON(
          (obj as Record<string, unknown>)[key],
          seen,
        );
        return acc;
      }, {});
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
