import { createInjectionToken } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

export const tokenDebug = createInjectionToken<boolean>('Debug', {
  useFactory: () => {
    const debug = process.env.DEBUG;
    assertIsDefined(debug, 'DEBUG is not defined');
    return debug === 'true';
  },
});
