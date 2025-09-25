import { registerTestInfrastructure } from '@backend/infrastructure';
import { CustomerType, UserMother } from '@backend/models';
import { tokenCreateOpportunityUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { CreateOpportunityAdapter } from './CreateOpportunityAdapter';
import { CreateOpportunityAdapterEventMother } from './CreateOpportunityAdapterEventMother';

describe('CreateOpportunity adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = CreateOpportunityAdapterEventMother.basic().build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should throw a bad request error with invalid json body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().withBody('{').build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should throw a bad request error with invalid body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withBody(JSON.stringify({ invalid: 'body' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when opportunityDetails.customerCountry is invalid', async () => {
      const { adapter } = setup();

      const event = CreateOpportunityAdapterEventMother.basic()
        .withCustomerCountry('XX_INVALID')
        .build();

      const response = await adapter.handle(event);

      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('Invalid country code');
    });

    it('should return 400 when opportunityDetails.industry is invalid', async () => {
      const { adapter } = setup();

      const event = CreateOpportunityAdapterEventMother.basic()
        .withIndustry('NotARealIndustry')
        .build();

      const response = await adapter.handle(event);

      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('Invalid industry');
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with path parameters and user', async () => {
      const { adapter, useCase } = setup();

      const event = CreateOpportunityAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .withCompanyName('testCompany')
        .withDuns('123456789')
        .withIndustry('Aerospace')
        .withCustomerType(CustomerType.INTERNAL_WORKLOAD)
        .withCompanyWebsiteUrl('https://test.io')
        .withCustomerCountry('US')
        .withCustomerPostalCode('1111')
        .withMonthlyRecurringRevenue('1111')
        .withTargetCloseDate('2097-01-01')
        .withCustomerCity('City')
        .withCustomerAddress('street')
        .build();

      await adapter.handle(event);

      expect(useCase.createOpportunity).toHaveBeenCalledWith({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        opportunityDetails: {
          companyName: 'testCompany',
          duns: '123456789',
          industry: 'Aerospace',
          customerType: 'INTERNAL_WORKLOAD',
          companyWebsiteUrl: 'https://test.io',
          customerCountry: 'US',
          customerPostalCode: '1111',
          monthlyRecurringRevenue: '1111',
          targetCloseDate: '2097-01-01',
          customerCity: 'City',
          customerAddress: 'street',
        },
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = CreateOpportunityAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { createOpportunity: vitest.fn() };
  register(tokenCreateOpportunityUseCase, { useValue: useCase });
  const adapter = new CreateOpportunityAdapter();
  return { useCase, adapter };
};
