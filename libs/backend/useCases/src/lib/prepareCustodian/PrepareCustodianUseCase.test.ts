import { vi } from 'vitest';

import {
  registerTestInfrastructure,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import {
  CUSTODIAN_FILE_NAME,
  PrepareCustodianUseCaseImpl,
} from './PrepareCustodianUseCase';

describe('Prepare custodian use case', () => {
  it('should put the policies file', async () => {
    const { useCase, fakeObjectsStorage } = setup();

    await expect(useCase.prepareCustodian()).resolves.toEqual(
      's3://test-s3-bucket/custodian.yml'
    );

    expect(fakeObjectsStorage.objects[CUSTODIAN_FILE_NAME]).toEqual(
      'mocked-policies-content'
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  vi.mock('fs', () => ({
    readFileSync: vi.fn(() => 'mocked-policies-content'),
  }));
  const fakeObjectsStorage = inject(tokenFakeObjectsStorage);
  return {
    useCase: new PrepareCustodianUseCaseImpl(),
    fakeObjectsStorage,
  };
};
