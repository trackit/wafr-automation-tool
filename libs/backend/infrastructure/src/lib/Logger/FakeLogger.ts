/* eslint-disable @typescript-eslint/no-empty-function */

import { Logger } from '@backend/ports';

export default class VoidLogger implements Logger {
  debug(): void {}

  error(): void {}

  info(): void {}

  warn(): void {}

  log(): void {}
}
