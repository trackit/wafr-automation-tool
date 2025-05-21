/* eslint-disable @typescript-eslint/no-empty-function */

import { Logger } from '@backend/ports';

export class FakeLogger implements Logger {
  debug(): void {}

  error(): void {}

  info(): void {}

  warn(): void {}

  log(): void {}
}
