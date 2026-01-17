import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenDeleteFolderUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { DeleteFolderAdapter } from './DeleteFolderAdapter';
import { DeleteFolderAdapterEventMother } from './DeleteFolderAdapterEventMother';

describe('deleteFolder adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = DeleteFolderAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = DeleteFolderAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
        }),
      );
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const event = DeleteFolderAdapterEventMother.basic()
        .withFolderName('My Folder')
        .withUser(user)
        .build();

      await adapter.handle(event);
      expect(useCase.deleteFolder).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          organizationDomain: user.organizationDomain,
          folderName: 'My Folder',
        }),
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = DeleteFolderAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { deleteFolder: vitest.fn() };
  register(tokenDeleteFolderUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new DeleteFolderAdapter() };
};
