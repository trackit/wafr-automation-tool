import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenGeneratePDFExportURLUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GeneratePDFExportURLAdapter } from './GeneratePDFExportURLAdapter';
import { GeneratePDFExportURLAdapterEventMother } from './GeneratePDFExportURLAdapterEventMother';

describe('generatePDFExportURL adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GeneratePDFExportURLAdapterEventMother.basic().build();

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

      const event = GeneratePDFExportURLAdapterEventMother.basic()
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

      expect(useCase.generatePDFExportURL).toHaveBeenCalledWith({
        assessmentId: 'assessment-id',
        fileExportId: 'file-export-id',
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = GeneratePDFExportURLAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const useCase = { generatePDFExportURL: vitest.fn() };
  useCase.generatePDFExportURL.mockResolvedValueOnce(Promise.resolve([]));
  register(tokenGeneratePDFExportURLUseCase, { useValue: useCase });

  const adapter = new GeneratePDFExportURLAdapter();
  return { useCase, adapter };
};
