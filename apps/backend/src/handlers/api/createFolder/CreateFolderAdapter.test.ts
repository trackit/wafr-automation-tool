import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenCreateFolderUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { CreateFolderAdapter } from './CreateFolderAdapter';
import { CreateFolderAdapterEventMother } from './CreateFolderAdapterEventMother';

describe('createFolder adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = CreateFolderAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = CreateFolderAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          bodySchema: expect.anything(),
        }),
      );
    });

    it('should return a 400 status code without body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with empty name', async () => {
      const { adapter } = setup();

      const event = CreateFolderAdapterEventMother.basic().withName('').build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const event = CreateFolderAdapterEventMother.basic()
        .withName('My Folder')
        .withUser(user)
        .build();

      await adapter.handle(event);
      expect(useCase.createFolder).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          organizationDomain: user.organizationDomain,
          folderName: 'My Folder',
        }),
      );
    });

    it('should return a 201 status code', async () => {
      const { adapter } = setup();

      const event = CreateFolderAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(201);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { createFolder: vitest.fn() };
  register(tokenCreateFolderUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new CreateFolderAdapter() };
};
