import { register, reset } from '@shared/di-container';
import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenExportWellArchitectedToolUseCase } from '@backend/useCases';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { ExportWellArchitectedToolAdapter } from './ExportWellArchitectedToolAdapter';
import { ExportWellArchitectedToolAdapterEventMother } from './ExportWellArchitectedToolAdapterEventMother';

describe('exportWellArchitectedTool adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with path parameters and user', async () => {
      const { adapter, useCase } = setup();

      const event = ExportWellArchitectedToolAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);

      expect(useCase.exportAssessment).toHaveBeenCalledWith({
        assessmentId: 'assessment-id',
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = ExportWellArchitectedToolAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { exportAssessment: vitest.fn() };
  useCase.exportAssessment.mockResolvedValueOnce(Promise.resolve());
  register(tokenExportWellArchitectedToolUseCase, { useValue: useCase });
  const adapter = new ExportWellArchitectedToolAdapter();
  return { useCase, adapter };
};
