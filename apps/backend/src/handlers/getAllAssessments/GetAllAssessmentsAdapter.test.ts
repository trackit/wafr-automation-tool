import { tokenGetAllAssessmentsUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { UserMother } from '@backend/models';
import { GetAllAssessmentsAdapter } from './GetAllAssessmentsAdapter';
import { GetAllAssessmentsAdapterEventMother } from './GetAllAssessmentsAdapterEventMother';

describe('getAllAssessments adapter', () => {
  describe('query parameters validation', () => {
    it('should validate parameters', async () => {
      const { adapter } = setup();

      const event = GetAllAssessmentsAdapterEventMother.basic()
        .withLimit(10)
        .withSearch('test')
        .withNextToken('test')
        .build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should return a 400 if the limit is negative', async () => {
      const { adapter } = setup();

      const event = GetAllAssessmentsAdapterEventMother.basic()
        .withLimit(-1)
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should pass without query parameters', async () => {
      const { adapter } = setup();

      const event = GetAllAssessmentsAdapterEventMother.basic().build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with query parameters and organization', async () => {
      const { adapter, useCase } = setup();

      const event = GetAllAssessmentsAdapterEventMother.basic()
        .withLimit(10)
        .withSearch('test')
        .withNextToken('test')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);

      expect(useCase.getAllAssessments).toHaveBeenCalledWith({
        limit: 10,
        search: 'test',
        next_token: 'test',
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = GetAllAssessmentsAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  const useCase = { getAllAssessments: vitest.fn() };
  useCase.getAllAssessments.mockResolvedValueOnce(
    Promise.resolve({
      assessments: [],
    })
  );
  register(tokenGetAllAssessmentsUseCase, { useValue: useCase });
  const adapter = new GetAllAssessmentsAdapter();
  return { useCase, adapter };
};
