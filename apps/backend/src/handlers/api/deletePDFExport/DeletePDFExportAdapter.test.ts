import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenDeletePDFExportUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
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

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = DeletePDFExportAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
        })
      );
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with path parameters and user', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const fileExportId = 'file-export-id';

      const user = UserMother.basic().build();

      const event = DeletePDFExportAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withFileExportId(fileExportId)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.deletePDFExport).toHaveBeenCalledWith({
        assessmentId,
        fileExportId,
        user,
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

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { deletePDFExport: vitest.fn() };
  useCase.deletePDFExport.mockResolvedValueOnce(Promise.resolve());
  register(tokenDeletePDFExportUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new DeletePDFExportAdapter() };
};
