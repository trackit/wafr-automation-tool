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

import {
  AssessmentNotFoundError,
  OrganizationAccountIdNotSetError,
  OrganizationNotFoundError,
  OrganizationUnitBasedAgreementIdNotSetError,
} from '../../errors';
import { CleanupUseCaseImpl, tokenDebug } from './CleanupUseCase';
import { CleanupUseCaseArgsMother } from './CleanupUseCaseArgsMother';

describe('CleanupUseCase', () => {
  describe('cleanup', () => {
    it('should delete assessment storage if not in debug mode', async () => {
      const { useCase, fakeObjectsStorage } = setup();

      fakeObjectsStorage.put({
        key: 'assessments/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/test',
        body: 'hello world',
      });
      useCase.cleanupSuccessful = vitest.fn();

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withError(undefined)
        .build();
      await useCase.cleanup(input);

      expect(
        fakeObjectsStorage.objects[
          'assessments/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/test'
        ]
      ).toBeUndefined();
    });

    it('should not delete assessment storage if debug mode is enabled', async () => {
      const { useCase, fakeObjectsStorage } = setup(true);

      fakeObjectsStorage.put({
        key: 'assessments/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/test',
        body: 'hello world',
      });
      useCase.cleanupSuccessful = vitest.fn();

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withError(undefined)
        .build();
      await useCase.cleanup(input);

      expect(
        fakeObjectsStorage.objects[
          'assessments/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/test'
        ]
      ).toBeDefined();
    });
  });

  describe('cleanupError', () => {
    it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
      const { useCase, fakeAssessmentsRepository } = setup();

      const input = CleanupUseCaseArgsMother.basic().build();
      fakeAssessmentsRepository.assessments = {};
      fakeAssessmentsRepository.assessmentFindings = {};

      await expect(useCase.cleanupError(input)).rejects.toThrow(
        AssessmentNotFoundError
      );
    });

    it('should delete assessment findings if not in debug mode and error is defined', async () => {
      const { useCase, fakeAssessmentsRepository } = setup();

      fakeAssessmentsRepository.save(
        AssessmentMother.basic()
          .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('test.io')
          .build()
      );
      fakeAssessmentsRepository.saveFinding({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
        finding: FindingMother.basic().build(),
      });

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('test.io')
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();
      await useCase.cleanupError(input);

      expect(
        fakeAssessmentsRepository.assessmentFindings[
          '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
        ]
      ).toBeUndefined();
    });

    it('should not delete assessment findings if debug mode is enabled and error is defined', async () => {
      const { useCase, fakeAssessmentsRepository } = setup(true);

      fakeAssessmentsRepository.save(
        AssessmentMother.basic()
          .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('test.io')
          .build()
      );
      fakeAssessmentsRepository.saveFinding({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'test.io',
        finding: FindingMother.basic().build(),
      });

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('test.io')
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();
      await useCase.cleanupError(input);

      expect(
        fakeAssessmentsRepository.assessmentFindings[
          '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
        ]
      ).toBeDefined();
    });

    it('should update assessment error if error is defined', async () => {
      const { useCase, fakeAssessmentsRepository } = setup(true);

      fakeAssessmentsRepository.save(
        AssessmentMother.basic()
          .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('test.io')
          .build()
      );

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('test.io')
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();
      await useCase.cleanupError(input);

      const updatedAssessment =
        fakeAssessmentsRepository.assessments[
          '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
        ];
      expect(updatedAssessment.error).toEqual({
        error: 'test-error',
        cause: 'test-cause',
      });
      expect(updatedAssessment.step).toEqual(AssessmentStep.ERRORED);
    });
  });

  describe('cleanupSuccessful', () => {
    it('should throw a OrganizationNotFoundError if the organization doesn’t exist', async () => {
      const { useCase } = setup();

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('test.io')
        .build();
      await expect(useCase.cleanupSuccessful(input)).rejects.toThrow(
        OrganizationNotFoundError
      );
    });

    it('should throw a OrganizationAccountIdNotSetError if the organization account ID is not set', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .withAccountId(undefined)
        .withFreeAssessmentsLeft(0)
        .build();
      fakeOrganizationRepository.save({
        organization,
      });

      fakeFeatureToggleRepository.marketplaceIntegration = vitest
        .fn()
        .mockImplementation(() => true);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('test.io')
        .build();
      await expect(useCase.cleanupSuccessful(input)).rejects.toThrow(
        OrganizationAccountIdNotSetError
      );
    });

    it('should throw a OrganizationUnitBasedAgreementIdNotSetError if the organization unit-based agreement ID is not set', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('test.io')
        .withUnitBasedAgreementId(undefined)
        .withFreeAssessmentsLeft(0)
        .build();
      fakeOrganizationRepository.save({
        organization,
      });

      fakeFeatureToggleRepository.marketplaceIntegration = vitest
        .fn()
        .mockImplementation(() => true);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('test.io')
        .build();
      await expect(useCase.cleanupSuccessful(input)).rejects.toThrow(
        OrganizationUnitBasedAgreementIdNotSetError
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
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('test.io')
        .build();
      await useCase.cleanupSuccessful(input);

      expect(
        fakeMarketplaceService.consumeReviewUnit
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ accountId: 'accountId' })
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
