import {
  registerTestInfrastructure,
  tokenDebug,
  tokenFakeAssessmentsRepository,
  tokenFakeFeatureToggleRepository,
  tokenFakeFindingsRepository,
  tokenFakeMarketplaceService,
  tokenFakeObjectsStorage,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
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
import { CleanupUseCaseImpl } from './CleanupUseCase';
import { CleanupUseCaseArgsMother } from './CleanupUseCaseArgsMother';

vitest.useFakeTimers();

describe('CleanupUseCase', () => {
  describe('cleanup', () => {
    it('should delete assessment storage if not in debug mode', async () => {
      const { useCase, fakeObjectsStorage } = setup();

      await fakeObjectsStorage.put({
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
        ],
      ).toBeUndefined();
    });

    it('should not delete assessment storage if debug mode is enabled', async () => {
      const { useCase, fakeObjectsStorage } = setup(true);

      await fakeObjectsStorage.put({
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
        ],
      ).toBeDefined();
    });
  });

  describe('cleanupError', () => {
    it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
      const { useCase } = setup();

      const input = CleanupUseCaseArgsMother.basic().build();

      await expect(useCase.cleanupError(input)).rejects.toThrow(
        AssessmentNotFoundError,
      );
    });

    it('should delete assessment findings if not in debug mode and error is defined', async () => {
      const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
        setup();

      const assessment = AssessmentMother.basic().build();
      await fakeAssessmentsRepository.save(assessment);

      const finding = FindingMother.basic().build();
      await fakeFindingsRepository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding,
      });

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganizationDomain(assessment.organization)
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();

      await useCase.cleanupError(input);

      const findings = await fakeFindingsRepository.getAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(findings).toEqual([]);
    });

    it('should not delete assessment findings if debug mode is enabled and error is defined', async () => {
      const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
        setup(true);

      const assessment = AssessmentMother.basic().build();
      await fakeAssessmentsRepository.save(assessment);

      const finding = FindingMother.basic().build();
      await fakeFindingsRepository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding,
      });

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganizationDomain(assessment.organization)
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();

      await useCase.cleanupError(input);

      const findings = await fakeFindingsRepository.getAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(findings).toBeDefined();
    });

    it('should update assessment error if error is defined', async () => {
      const { date, useCase, fakeAssessmentsRepository } = setup(true);

      const assessment = AssessmentMother.basic().build();
      await fakeAssessmentsRepository.save(assessment);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganizationDomain(assessment.organization)
        .withError({ Cause: 'test-cause', Error: 'test-error' })
        .build();

      await useCase.cleanupError(input);

      const updatedAssessment = await fakeAssessmentsRepository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(updatedAssessment?.error).toEqual({
        error: 'test-error',
        cause: 'test-cause',
      });
      expect(updatedAssessment?.finishedAt).toEqual(date);
    });
  });

  describe('cleanupSuccessful', () => {
    it('should throw a OrganizationNotFoundError if the organization doesn’t exist', async () => {
      const { useCase } = setup();

      const input = CleanupUseCaseArgsMother.basic()
        .withOrganizationDomain('test.io')
        .build();

      await expect(useCase.cleanupSuccessful(input)).rejects.toThrow(
        OrganizationNotFoundError,
      );
    });

    it('should throw a OrganizationAccountIdNotSetError if the organization account ID is not set', async () => {
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

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockReturnValue(true);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganizationDomain(organization.domain)
        .build();

      await expect(useCase.cleanupSuccessful(input)).rejects.toThrow(
        OrganizationAccountIdNotSetError,
      );
    });

    it('should throw a OrganizationUnitBasedAgreementIdNotSetError if the organization unit-based agreement ID is not set', async () => {
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

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockReturnValue(true);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganizationDomain(organization.domain)
        .build();

      await expect(useCase.cleanupSuccessful(input)).rejects.toThrow(
        OrganizationUnitBasedAgreementIdNotSetError,
      );
    });

    it('should consume a free assessment trial if available', async () => {
      const { useCase, fakeOrganizationRepository } = setup();

      const organization = OrganizationMother.basic()
        .withFreeAssessmentsLeft(1)
        .build();
      await fakeOrganizationRepository.save(organization);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganizationDomain(organization.domain)
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

      const organization = OrganizationMother.basic().build();
      await fakeOrganizationRepository.save(organization);

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockReturnValue(false);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganizationDomain(organization.domain)
        .build();

      await useCase.cleanupSuccessful(input);

      expect(
        fakeMarketplaceService.hasMonthlySubscription,
      ).not.toHaveBeenCalled();
    });

    it('should not consume any review unit if the organization has a monthly subscription', async () => {
      const {
        useCase,
        fakeOrganizationRepository,
        fakeMarketplaceService,
        fakeFeatureToggleRepository,
      } = setup();

      const organization = OrganizationMother.basic().build();
      await fakeOrganizationRepository.save(organization);

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockReturnValue(true);
      vitest
        .spyOn(fakeMarketplaceService, 'hasMonthlySubscription')
        .mockResolvedValue(true);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganizationDomain(organization.domain)
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

      const organization = OrganizationMother.basic().build();
      await fakeOrganizationRepository.save(organization);

      vitest
        .spyOn(fakeFeatureToggleRepository, 'marketplaceIntegration')
        .mockReturnValue(true);
      vitest
        .spyOn(fakeMarketplaceService, 'hasMonthlySubscription')
        .mockResolvedValue(false);
      vitest
        .spyOn(fakeMarketplaceService, 'hasUnitBasedSubscription')
        .mockResolvedValue(true);

      const input = CleanupUseCaseArgsMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganizationDomain(organization.domain)
        .build();

      await useCase.cleanupSuccessful(input);

      expect(
        fakeMarketplaceService.consumeReviewUnit,
      ).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ accountId: organization.accountId }),
      );
    });
  });
});

const setup = (debug = false) => {
  reset();
  registerTestInfrastructure();

  register(tokenDebug, { useValue: debug });

  const fakeMarketplaceService = inject(tokenFakeMarketplaceService);
  vitest.spyOn(fakeMarketplaceService, 'consumeReviewUnit');
  vitest.spyOn(fakeMarketplaceService, 'hasMonthlySubscription');
  vitest.spyOn(fakeMarketplaceService, 'hasUnitBasedSubscription');

  const date = new Date();
  vitest.setSystemTime(date);

  return {
    date,
    useCase: new CleanupUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
    fakeObjectsStorage: inject(tokenFakeObjectsStorage),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    fakeMarketplaceService,
    fakeFeatureToggleRepository: inject(tokenFakeFeatureToggleRepository),
  };
};
