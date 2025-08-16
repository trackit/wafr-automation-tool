import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GetMilestonePillarsAdapter } from './GetMilestonePillarsAdapter';
import { GetMilestonePillarsAdapterEventMother } from './GetMilestonePillarsAdapterEventMother';
import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenGetMilestonePillarsUseCase } from '@backend/useCases';

describe('GetMilestonePillarsAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetMilestonePillarsAdapterEventMother.basic().build();
      const response = await adapter.handle(event);

      expect(response.statusCode).toBe(200);
    });

    it('should return a 400 without path parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters(null)
        .withBody(JSON.stringify({ region: 'us-west-2' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: 'invalid-uuid',
          milestoneId: '1',
        })
        .withBody(JSON.stringify({ region: 'us-west-2' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid milestoneId', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          milestoneId: 'invalid-number',
        })
        .withBody(JSON.stringify({ region: 'us-west-2' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 without body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          milestoneId: '1',
        })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          milestoneId: '1',
        })
        .withBody(JSON.stringify({ invalid: 'body' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('getMilestonePillars', () => {
    it('should call the use case with correct parameters', async () => {
      const { adapter, useCase } = setup();

      const event = GetMilestonePillarsAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withMilestoneId(2)
        .withRegion('eu-west-1')
        .withUser({
          id: 'user-id',
          email: 'user-id@test.io',
        })
        .build();

      await adapter.handle(event);

      expect(useCase.getMilestonePillars).toHaveBeenCalledWith({
        organizationDomain: 'test.io',
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        milestoneId: 2,
        region: 'eu-west-1',
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { getMilestonePillars: vitest.fn() };
  useCase.getMilestonePillars.mockResolvedValueOnce(Promise.resolve([]));
  register(tokenGetMilestonePillarsUseCase, { useValue: useCase });
  const adapter = new GetMilestonePillarsAdapter();
  return { adapter, useCase };
};
