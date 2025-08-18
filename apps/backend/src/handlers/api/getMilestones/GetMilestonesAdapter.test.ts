import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GetMilestonesAdapter } from './GetMilestonesAdapter';
import { GetMilestonesAdapterEventMother } from './GetMilestonesAdapterEventMother';
import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenGetMilestonesUseCase } from '@backend/useCases';

describe('GetMilestonesAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetMilestonesAdapterEventMother.basic().build();
      const response = await adapter.handle(event);

      expect(response.statusCode).toBe(200);
    });

    it('should return a 400 without query parameters', async () => {
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
        .withPathParameters({ assessmentId: 'invalid-uuid' })
        .withBody(JSON.stringify({ region: 'us-west-2' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('getMilestones', () => {
    it('should call the use case with correct parameters', async () => {
      const { adapter, useCase } = setup();
      const event = GetMilestonesAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withRegion('eu-west-1')
        .withUser({ id: 'user-id', email: 'user-id@test.io' })
        .build();

      await adapter.handle(event);

      expect(useCase.getMilestones).toHaveBeenCalledWith({
        organizationDomain: 'test.io',
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        region: 'eu-west-1',
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { getMilestones: vi.fn() };
  useCase.getMilestones.mockResolvedValueOnce(Promise.resolve([]));
  register(tokenGetMilestonesUseCase, { useValue: useCase });
  const adapter = new GetMilestonesAdapter();
  return { adapter, useCase };
};
