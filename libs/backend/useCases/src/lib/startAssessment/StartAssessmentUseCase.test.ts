import {
  registerTestInfrastructure,
  tokenFakeAssessmentsStateMachine,
  tokenFakeMarketplaceService,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import { OrganizationMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { ForbiddenError } from '../Errors';
import {
  StartAssessmentUseCaseArgs,
  StartAssessmentUseCaseImpl,
} from './StartAssessmentUseCase';
import { StartAssessmentUseCaseArgsMother } from './StartAssessmentUseCaseArgsMother';

vitest.useFakeTimers();

describe('startAssessment UseCase', () => {
  describe('startAssessment', () => {
    it('should start an assessment with default regions and workflows', async () => {
      const { useCase, fakeAssessmentsStateMachine } = setup();

      useCase.canStartAssessment = vitest.fn().mockResolvedValueOnce(true);

      const input: StartAssessmentUseCaseArgs =
        StartAssessmentUseCaseArgsMother.basic()
          .withRegions(undefined)
          .withWorkflows(undefined)
          .build();
      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          regions: [],
          workflows: [],
        })
      );
    });

    it('should start an assessment with complete args', async () => {
      const { useCase, fakeAssessmentsStateMachine, date } = setup();

      useCase.canStartAssessment = vitest.fn().mockResolvedValueOnce(true);

      const input: StartAssessmentUseCaseArgs =
        StartAssessmentUseCaseArgsMother.basic()
          .withName('Test Assessment')
          .withRegions(['us-west-1', 'us-west-2'])
          .withWorkflows(['workflow-1', 'workflow-2'])
          .withRoleArn('arn:aws:iam::123456789012:role/test-role')
          .withUser(
            UserMother.basic()
              .withEmail('user-id@test.io')
              .withId('user-id')
              .withOrganizationDomain('test.io')
              .build()
          )
          .build();
      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          name: 'Test Assessment',
          regions: ['us-west-1', 'us-west-2'],
          roleArn: 'arn:aws:iam::123456789012:role/test-role',
          workflows: ['workflow-1', 'workflow-2'],
          createdAt: date,
          assessmentId: expect.any(String),
          createdBy: 'user-id',
          organization: 'test.io',
        })
      );
    });

    it('should start an assessment with lowercase workflows name', async () => {
      const { useCase, fakeAssessmentsStateMachine } = setup();

      useCase.canStartAssessment = vitest.fn().mockResolvedValueOnce(true);

      const input: StartAssessmentUseCaseArgs =
        StartAssessmentUseCaseArgsMother.basic()
          .withWorkflows(['workFloW-1', 'WorKflOw-2'])
          .build();
      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          workflows: ['workflow-1', 'workflow-2'],
        })
      );
    });
  });

  describe('canStartAssessment', () => {
    it('should start an assessment if the user has a monthly subscription', async () => {
      const {
        useCase,
        fakeAssessmentsStateMachine,
        fakeOrganizationRepository,
        fakeMarketplaceService,
      } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .build();
      fakeOrganizationRepository.save(organization);
      fakeMarketplaceService.hasMonthlySubscription = vitest
        .fn()
        .mockImplementation(() => Promise.resolve(true));

      const input: StartAssessmentUseCaseArgs =
        StartAssessmentUseCaseArgsMother.basic()
          .withName('test assessment')
          .withUser(
            UserMother.basic().withOrganizationDomain('test.io').build()
          )
          .build();
      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ name: 'test assessment' })
      );
    });

    it('should start an assessment if the user has a unit based subscription', async () => {
      const {
        useCase,
        fakeAssessmentsStateMachine,
        fakeOrganizationRepository,
        fakeMarketplaceService,
      } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .build();
      fakeOrganizationRepository.save(organization);
      fakeMarketplaceService.hasUnitBasedSubscription = vitest
        .fn()
        .mockImplementation(() => Promise.resolve(true));

      const input: StartAssessmentUseCaseArgs =
        StartAssessmentUseCaseArgsMother.basic()
          .withName('test assessment')
          .withUser(
            UserMother.basic().withOrganizationDomain('test.io').build()
          )
          .build();
      await useCase.startAssessment(input);

      expect(
        fakeAssessmentsStateMachine.startAssessment
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ name: 'test assessment' })
      );
    });

    it('should throw an error if the user does not have a subscription', async () => {
      const { useCase, fakeOrganizationRepository } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .build();
      fakeOrganizationRepository.save(organization);

      const input: StartAssessmentUseCaseArgs =
        StartAssessmentUseCaseArgsMother.basic()
          .withName('test assessment')
          .withUser(
            UserMother.basic().withOrganizationDomain('test.io').build()
          )
          .build();
      await expect(useCase.startAssessment(input)).rejects.toThrowError(
        ForbiddenError
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeAssessmentsStateMachine = inject(tokenFakeAssessmentsStateMachine);
  vitest.spyOn(fakeAssessmentsStateMachine, 'startAssessment');
  const fakeOrganizationRepository = inject(tokenFakeOrganizationRepository);
  const fakeMarketplaceService = inject(tokenFakeMarketplaceService);
  const date = new Date();
  vitest.setSystemTime(date);
  const useCase = new StartAssessmentUseCaseImpl();
  return {
    useCase,
    fakeAssessmentsStateMachine,
    date,
    fakeOrganizationRepository,
    fakeMarketplaceService,
  };
};
