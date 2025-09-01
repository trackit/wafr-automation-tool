import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeFeatureToggleRepository,
  tokenFakeMarketplaceService,
  tokenFakeObjectsStorage,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentStep,
  FindingMother,
  OrganizationMother,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { NotFoundError } from '../Errors';
import { CleanupUseCaseImpl, tokenDebug } from './CleanupUseCase';
import { CleanupUseCaseArgsMother } from './CleanupUseCaseArgsMother';

describe('CleanupUseCase', () => {
  describe('cleanup', () => {
    it('should delete assessment storage if not in debug mode', async () => {
      const { useCase, fakeObjectsStorage } = setup();

      fakeObjectsStorage.put({
        key: 'assessments/assessment-id/test',
        body: 'hello world',
      });
      useCase.cleanupSuccessful = vitest.fn();

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withError(undefined)
        .build();
      await useCase.cleanup(input);

      expect(
        fakeObjectsStorage.objects['assessments/assessment-id/test']
      ).toBeUndefined();
    });

    it('should not delete assessment storage if debug mode is enabled', async () => {
      const { useCase, fakeObjectsStorage } = setup(true);

      fakeObjectsStorage.put({
        key: 'assessments/assessment-id/test',
        body: 'hello world',
      });
      useCase.cleanupSuccessful = vitest.fn();

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withError(undefined)
        .build();
      await useCase.cleanup(input);

      expect(
        fakeObjectsStorage.objects['assessments/assessment-id/test']
      ).toBeDefined();
    });
  });

  describe('cleanupError', () => {
    it('should throw a NotFoundError if the assessment doesn’t exist and error is defined', async () => {
      const { useCase } = setup();

      useCase.cleanupSuccessful = vitest.fn();

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();
      await expect(useCase.cleanupError(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw a NotFoundError if the assessment exist for an another organization and error is defined', async () => {
      const { useCase, fakeAssessmentsRepository } = setup();

      fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
        AssessmentMother.basic()
          .withId('assessment-id')
          .withOrganization('other-org.io')
          .build();

      const input = CleanupUseCaseArgsMother.basic()
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .build();
      await expect(useCase.cleanupError(input)).rejects.toThrow(NotFoundError);
    });

    it('should delete assessment findings if not in debug mode and error is defined', async () => {
      const { useCase, fakeAssessmentsRepository } = setup();

      fakeAssessmentsRepository.save(
        AssessmentMother.basic()
          .withId('assessment-id')
          .withOrganization('test.io')
          .build()
      );
      fakeAssessmentsRepository.saveFinding({
        assessmentId: 'assessment-id',
        organization: 'test.io',
        finding: FindingMother.basic().build(),
      });

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();
      await useCase.cleanupError(input);

      expect(
        fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io']
      ).toBeUndefined();
    });

    it('should not delete assessment findings if debug mode is enabled and error is defined', async () => {
      const { useCase, fakeAssessmentsRepository } = setup(true);

      fakeAssessmentsRepository.save(
        AssessmentMother.basic()
          .withId('assessment-id')
          .withOrganization('test.io')
          .build()
      );
      fakeAssessmentsRepository.saveFinding({
        assessmentId: 'assessment-id',
        organization: 'test.io',
        finding: FindingMother.basic().build(),
      });

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();
      await useCase.cleanupError(input);

      expect(
        fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io']
      ).toBeDefined();
    });

    it('should update assessment error if error is defined', async () => {
      const { useCase, fakeAssessmentsRepository } = setup(true);

      fakeAssessmentsRepository.save(
        AssessmentMother.basic()
          .withId('assessment-id')
          .withOrganization('test.io')
          .build()
      );

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();
      await useCase.cleanupError(input);

      const updatedAssessment =
        fakeAssessmentsRepository.assessments['assessment-id#test.io'];
      expect(updatedAssessment.error).toEqual({
        error: 'test-error',
        cause: 'test-cause',
      });
      expect(updatedAssessment.step).toEqual(AssessmentStep.ERRORED);
    });
  });

  describe('cleanupSuccessful', () => {
    it('should throw a NotFoundError if the organization doesn’t exist', async () => {
      const { useCase } = setup();

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .build();
      await expect(useCase.cleanupSuccessful(input)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should consume a free assessment trial if available', async () => {
      const { useCase, fakeOrganizationRepository } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .withFreeAssessmentsLeft(1)
        .build();
      fakeOrganizationRepository.save({
        organization,
      });

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .build();
      await useCase.cleanupSuccessful(input);

      expect(organization.freeAssessmentsLeft).toEqual(0);
    });

    it('should skip marketplace check if the marketplace feature toggle is disabled', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeMarketplaceService,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .build();
      fakeOrganizationRepository.save({
        organization,
      });
      fakeFeatureToggleRepository.marketplaceIntegration = vitest
        .fn()
        .mockImplementation(() => false);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .build();
      await useCase.cleanupSuccessful(input);

      expect(
        fakeMarketplaceService.hasMonthlySubscription
      ).not.toHaveBeenCalled();
    });

    it('should not consume any review unit if the organization has a monthly subscription', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeMarketplaceService,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .build();
      fakeOrganizationRepository.save({
        organization,
      });
      fakeFeatureToggleRepository.marketplaceIntegration = vitest
        .fn()
        .mockImplementation(() => true);
      fakeMarketplaceService.hasMonthlySubscription = vitest
        .fn()
        .mockImplementation(() => Promise.resolve(true));

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .build();
      await useCase.cleanupSuccessful(input);

      expect(fakeMarketplaceService.hasMonthlySubscription).toHaveBeenCalled();
      expect(fakeMarketplaceService.consumeReviewUnit).not.toHaveBeenCalled();
    });

    it('should consume a review unit if the organization has not a monthly subscription', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeMarketplaceService,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .withAccountId('accountId')
        .build();
      fakeOrganizationRepository.save({
        organization,
      });
      fakeFeatureToggleRepository.marketplaceIntegration = vitest
        .fn()
        .mockImplementation(() => true);
      fakeMarketplaceService.hasMonthlySubscription = vitest
        .fn()
        .mockImplementation(() => Promise.resolve(false));
      fakeMarketplaceService.hasUnitBasedSubscription = vitest
        .fn()
        .mockImplementation(() => Promise.resolve(true));

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('assessment-id')
        .withOrganization('test.io')
        .build();
      await useCase.cleanupSuccessful(input);

      expect(
        fakeMarketplaceService.consumeReviewUnit
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ organization })
      );
    });
  });
});

const setup = (debug = false) => {
  reset();
  registerTestInfrastructure();
  register(tokenDebug, { useValue: debug });
  const fakeObjectsStorage = inject(tokenFakeObjectsStorage);
  const fakeAssessmentsRepository = inject(tokenFakeAssessmentsRepository);
  const fakeOrganizationRepository = inject(tokenFakeOrganizationRepository);
  const fakeMarketplaceService = inject(tokenFakeMarketplaceService);
  vitest.spyOn(fakeMarketplaceService, 'consumeReviewUnit');
  vitest.spyOn(fakeMarketplaceService, 'hasMonthlySubscription');
  vitest.spyOn(fakeMarketplaceService, 'hasUnitBasedSubscription');
  const fakeFeatureToggleRepository = inject(tokenFakeFeatureToggleRepository);
  return {
    useCase: new CleanupUseCaseImpl(),
    fakeAssessmentsRepository,
    fakeObjectsStorage,
    fakeOrganizationRepository,
    fakeMarketplaceService,
    fakeFeatureToggleRepository,
  };
};
