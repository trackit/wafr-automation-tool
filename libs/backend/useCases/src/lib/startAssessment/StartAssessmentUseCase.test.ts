import {
  registerTestInfrastructure,
  tokenFakeAssessmentsStateMachine,
  tokenFakeFeatureToggleRepository,
  tokenFakeMarketplaceService,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import { OrganizationMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  OrganizationAccountIdNotSetError,
  OrganizationNoActiveSubscriptionError,
  OrganizationUnitBasedAgreementIdNotSetError,
} from '../../errors';
import { StartAssessmentUseCaseImpl } from './StartAssessmentUseCase';
import { StartAssessmentUseCaseArgsMother } from './StartAssessmentUseCaseArgsMother';

vitest.useFakeTimers();

describe('StartAssessmentUseCase', () => {
  describe('startAssessment', () => {
    it('should start an assessment with default regions and workflows', async () => {
      const { useCase, fakeAssessmentsStateMachine } = setup();

      vitest.spyOn(useCase, 'canStartAssessment').mockResolvedValueOnce(true);

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withRegions(undefined)
        .withWorkflows(undefined)
        .build();

      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment,
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          regions: [],
          workflows: [],
        }),
      );
    });

    it('should start an assessment with complete args', async () => {
      const { useCase, fakeAssessmentsStateMachine, date } = setup();

      const user = UserMother.basic().build();

      vitest.spyOn(useCase, 'canStartAssessment').mockResolvedValueOnce(true);

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withName('Test Assessment')
        .withRegions(['us-west-1', 'us-west-2'])
        .withWorkflows(['workflow-1', 'workflow-2'])
        .withRoleArn('arn:aws:iam::123456789012:role/test-role')
        .withUser(user)
        .build();

      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment,
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          name: input.name,
          regions: input.regions,
          roleArn: input.roleArn,
          workflows: input.workflows,
          createdAt: date,
          assessmentId: expect.any(String),
          createdBy: user.id,
          organizationDomain: user.organizationDomain,
        }),
      );
    });

    it('should start an assessment with lowercase workflows name', async () => {
      const { useCase, fakeAssessmentsStateMachine } = setup();

      vitest.spyOn(useCase, 'canStartAssessment').mockResolvedValueOnce(true);

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withWorkflows(['workFloW-1', 'WorKflOw-2'])
        .build();
      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment,
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          workflows: ['workflow-1', 'workflow-2'],
        }),
      );
    });
  });

  describe('canStartAssessment', () => {
    it('should start an assessment if the organization has free assessments left', async () => {
      const {
        useCase,
        fakeAssessmentsStateMachine,
        fakeOrganizationRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withFreeAssessmentsLeft(1)
        .build();
      await fakeOrganizationRepository.save(organization);

      const user = UserMother.basic()
        .withOrganizationDomain(organization.domain)
        .build();

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withName('test assessment')
        .withUser(user)
        .build();

      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment,
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ name: input.name }),
      );
      expect(organization.freeAssessmentsLeft).toEqual(1);
    });

    it('should start an assessment by skipping the marketplace check if the marketplace feature toggle is disabled', async () => {
      const {
        useCase,
        fakeAssessmentsStateMachine,
        fakeOrganizationRepository,
        fakeMarketplaceService,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withFreeAssessmentsLeft(0)
        .build();
      await fakeOrganizationRepository.save(organization);

      const user = UserMother.basic()
        .withOrganizationDomain(organization.domain)
        .build();

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockImplementation(() => false);

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withName('test assessment')
        .withUser(user)
        .build();

      await useCase.startAssessment(input);

      expect(
        fakeMarketplaceService.hasMonthlySubscription,
      ).not.toHaveBeenCalled();
      expect(
        fakeAssessmentsStateMachine.startAssessment,
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ name: input.name }),
      );
    });

    it('should start an assessment if the user has a monthly subscription and the marketplace feature toggle is enabled', async () => {
      const {
        useCase,
        fakeAssessmentsStateMachine,
        fakeOrganizationRepository,
        fakeFeatureToggleRepository,
        fakeMarketplaceService,
      } = setup();

      const organization = OrganizationMother.basic()
        .withFreeAssessmentsLeft(0)
        .build();
      await fakeOrganizationRepository.save(organization);

      const user = UserMother.basic()
        .withOrganizationDomain(organization.domain)
        .build();

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockImplementation(() => true);

      vitest
        .spyOn(fakeMarketplaceService, 'hasMonthlySubscription')
        .mockImplementation(() => Promise.resolve(true));

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withName('test assessment')
        .withUser(user)
        .build();

      await useCase.startAssessment(input);

      expect(
        fakeMarketplaceService.hasUnitBasedSubscription,
      ).not.toHaveBeenCalled();
      expect(
        fakeAssessmentsStateMachine.startAssessment,
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ name: input.name }),
      );
    });

    it('should start an assessment if the user has a unit based subscription and the marketplace feature toggle is enabled', async () => {
      const {
        useCase,
        fakeAssessmentsStateMachine,
        fakeOrganizationRepository,
        fakeFeatureToggleRepository,
        fakeMarketplaceService,
      } = setup();

      const organization = OrganizationMother.basic()
        .withFreeAssessmentsLeft(0)
        .build();
      await fakeOrganizationRepository.save(organization);

      const user = UserMother.basic()
        .withOrganizationDomain(organization.domain)
        .build();

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockImplementation(() => true);

      vitest
        .spyOn(fakeMarketplaceService, 'hasUnitBasedSubscription')
        .mockImplementation(() => Promise.resolve(true));

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withName('test assessment')
        .withUser(user)
        .build();

      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment,
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ name: input.name }),
      );
    });

    it('should throw OrganizationNoActiveSubscriptionError if the user does not have a subscription or free assessments left', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withFreeAssessmentsLeft(0)
        .build();
      await fakeOrganizationRepository.save(organization);

      const user = UserMother.basic()
        .withOrganizationDomain(organization.domain)
        .build();

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockImplementation(() => true);

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withName('test assessment')
        .withUser(user)
        .build();

      await expect(useCase.startAssessment(input)).rejects.toThrowError(
        OrganizationNoActiveSubscriptionError,
      );
    });

    it('should throw OrganizationAccountIdNotSetError if the organization account ID is not set', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withAccountId(undefined)
        .withFreeAssessmentsLeft(0)
        .build();
      await fakeOrganizationRepository.save(organization);

      const user = UserMother.basic()
        .withOrganizationDomain(organization.domain)
        .build();

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockImplementation(() => true);

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withUser(user)
        .build();

      await expect(useCase.startAssessment(input)).rejects.toThrowError(
        OrganizationAccountIdNotSetError,
      );
    });

    it('should throw OrganizationUnitBasedAgreementIdNotSetError if the organization unit-based agreement ID is not set', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withUnitBasedAgreementId(undefined)
        .withFreeAssessmentsLeft(0)
        .build();
      await fakeOrganizationRepository.save(organization);

      const user = UserMother.basic()
        .withOrganizationDomain(organization.domain)
        .build();

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockImplementation(() => true);

      const input = StartAssessmentUseCaseArgsMother.basic()
        .withUser(user)
        .build();

      await expect(useCase.startAssessment(input)).rejects.toThrowError(
        OrganizationUnitBasedAgreementIdNotSetError,
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const fakeAssessmentsStateMachine = inject(tokenFakeAssessmentsStateMachine);
  vitest.spyOn(fakeAssessmentsStateMachine, 'startAssessment');

  const fakeMarketplaceService = inject(tokenFakeMarketplaceService);
  vitest.spyOn(fakeMarketplaceService, 'hasUnitBasedSubscription');
  vitest.spyOn(fakeMarketplaceService, 'hasMonthlySubscription');

  const date = new Date();
  vitest.setSystemTime(date);

  return {
    useCase: new StartAssessmentUseCaseImpl(),
    fakeAssessmentsStateMachine,
    fakeMarketplaceService,
    date,
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    fakeFeatureToggleRepository: inject(tokenFakeFeatureToggleRepository),
  };
};
