import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenDeletePDFExportUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { DeletePDFExportAdapter } from './DeletePDFExportAdapter';
import { DeletePDFExportAdapterEventMother } from './DeletePDFExportAdapterEventMother';

describe('deletePDFExport adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = DeletePDFExportAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
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

      const event = DeletePDFExportAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withFileExportId('file-export-id')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);

      expect(useCase.deletePDFExport).toHaveBeenCalledWith({
        assessmentId: 'assessment-id',
        fileExportId: 'file-export-id',
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = DeletePDFExportAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const useCase = { deletePDFExport: vitest.fn() };
  useCase.deletePDFExport.mockResolvedValueOnce(Promise.resolve());
  register(tokenDeletePDFExportUseCase, { useValue: useCase });

  const adapter = new DeletePDFExportAdapter();
  return { useCase, adapter };
};
