import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenStartPDFExportUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { StartPDFExportAdapter } from './StartPDFExportAdapter';
import { StartPDFExportAdapterEventMother } from './StartPDFExportAdapterEventMother';

describe('startPDFExport adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = StartPDFExportAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should call parseApiEvent with correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = StartPDFExportAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          bodySchema: expect.anything(),
        })
      );
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with path parameters and user', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const versionName = 'version-name';

      const event = StartPDFExportAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withVersionName(versionName)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.startPDFExport).toHaveBeenCalledWith({
        assessmentId,
        versionName,
        user,
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = StartPDFExportAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { startPDFExport: vitest.fn() };
  useCase.startPDFExport.mockResolvedValueOnce(Promise.resolve());
  register(tokenStartPDFExportUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new StartPDFExportAdapter() };
};
