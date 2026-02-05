import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenGetMilestonesUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { GetMilestonesAdapter } from './GetMilestonesAdapter';
import { GetMilestonesAdapterEventMother } from './GetMilestonesAdapterEventMother';

describe('getMilestones adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetMilestonesAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = GetMilestonesAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          querySchema: expect.anything(),
        }),
      );
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = GetMilestonesAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid limit', async () => {
      const { adapter } = setup();

      const event = GetMilestonesAdapterEventMother.basic()
        .withLimit(-1)
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid nextToken', async () => {
      const { adapter } = setup();

      const event = GetMilestonesAdapterEventMother.basic()
        .withNextToken('NOT_BASE64')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const region = 'eu-west-1';
      const event = GetMilestonesAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withRegion(region)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.getMilestones).toHaveBeenCalledWith({
        user,
        assessmentId,
        region,
        limit: undefined,
        nextToken: undefined,
      });
    });

    it('should call the use case with pagination parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const region = 'eu-west-1';
      const limit = 10;
      const nextToken = 'dGVzdC10b2tlbg=='; // base64 encoded 'test-token'
      const event = GetMilestonesAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withRegion(region)
        .withLimit(limit)
        .withNextToken(nextToken)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.getMilestones).toHaveBeenCalledWith({
        user,
        assessmentId,
        region,
        limit,
        nextToken,
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = GetMilestonesAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { getMilestones: vitest.fn() };
  useCase.getMilestones.mockResolvedValueOnce(
    Promise.resolve({ milestones: [], nextToken: undefined }),
  );
  register(tokenGetMilestonesUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new GetMilestonesAdapter() };
};
