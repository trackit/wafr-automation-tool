export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'log';

export type Logger = {
  [logLevel in LogLevel]: (message: string, data?: unknown) => void;
};
