import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenUpdateFolderUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { UpdateFolderAdapter } from './UpdateFolderAdapter';
import { UpdateFolderAdapterEventMother } from './UpdateFolderAdapterEventMother';

describe('updateFolder adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = UpdateFolderAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = UpdateFolderAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          bodySchema: expect.anything(),
        }),
      );
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with empty new name', async () => {
      const { adapter } = setup();

      const event = UpdateFolderAdapterEventMother.basic()
        .withNewName('')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const event = UpdateFolderAdapterEventMother.basic()
        .withFolderName('Old Folder')
        .withNewName('New Folder')
        .withUser(user)
        .build();

      await adapter.handle(event);
      expect(useCase.updateFolder).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          organizationDomain: user.organizationDomain,
          oldFolderName: 'Old Folder',
          newFolderName: 'New Folder',
        }),
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateFolderAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { updateFolder: vitest.fn() };
  register(tokenUpdateFolderUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new UpdateFolderAdapter() };
};
