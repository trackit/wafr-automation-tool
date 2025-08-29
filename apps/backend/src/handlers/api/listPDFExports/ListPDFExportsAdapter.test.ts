import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenListPDFExportsUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { ListPDFExportsAdapter } from './ListPDFExportsAdapter';
import { ListPDFExportsAdapterEventMother } from './ListPDFExportsAdapterEventMother';

describe('listPDFExports adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = ListPDFExportsAdapterEventMother.basic().build();

      expect(adapter.handle(event)).not.toBe(400);
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with path parameters and user', async () => {
      const { adapter, useCase } = setup();

      const event = ListPDFExportsAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);

      expect(useCase.listPDFExports).toHaveBeenCalledWith({
        assessmentId: 'assessment-id',
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = ListPDFExportsAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const useCase = { listPDFExports: vitest.fn() };
  useCase.listPDFExports.mockResolvedValueOnce(Promise.resolve([]));
  register(tokenListPDFExportsUseCase, { useValue: useCase });

  const adapter = new ListPDFExportsAdapter();
  return { useCase, adapter };
};
