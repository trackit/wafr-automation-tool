import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenCleanupUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { CleanupAdapter } from './CleanupAdapter';
import { CleanupAdapterEventMother } from './CleanupAdapterEventMother';

describe('cleanup adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = CleanupAdapterEventMother.basic().build();
      await adapter.handle(event);
    });
  });

  describe('useCase', () => {
    it('should call useCase with assessmentId, organization and error', async () => {
      const { adapter, useCase } = setup();

      const event = CleanupAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .withError({
          Cause: 'test-cause',
          Error: 'test-error',
        })
        .build();

      await expect(adapter.handle(event)).resolves.toBeUndefined();
      expect(useCase.cleanup).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: 'assessment-id',
          organization: 'test.io',
          error: { Cause: 'test-cause', Error: 'test-error' },
        })
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { cleanup: vitest.fn() };
  register(tokenCleanupUseCase, { useValue: useCase });
  const adapter = new CleanupAdapter();
  return { useCase, adapter };
};
