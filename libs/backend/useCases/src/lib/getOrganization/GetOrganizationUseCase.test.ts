import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { Assessment, AssessmentMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { GetOrganizationUseCaseImpl } from './GetOrganizationUseCase';
import { GetOrganizationUseCaseArgsMother } from './GetOrganizationUseCaseArgsMother';

vitest.useFakeTimers();

describe('GetOrganizationUseCase', () => {
  describe('should call AssessmentsRepository to extract total number of assessments of specific organization on the current year', () => {
    it('should count only current year assessments', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const currentYear = date.getFullYear();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withCreatedAt(new Date(`${currentYear}-01-15`))
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withCreatedAt(new Date(`${currentYear}-06-20`))
        .build();

      const assessment3 = AssessmentMother.basic()
        .withId('assessment-3')
        .withOrganization('test.io')
        .withCreatedAt(new Date(`${currentYear - 1}-12-31`))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);
      await fakeAssessmentsRepository.save(assessment3);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(result.totalAssessments).toBe(2);
    });

    it('should paginate through all assessments', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();

      const assessmentsPage1: Assessment[] = [];
      for (let i = 0; i < 100; i++) {
        assessmentsPage1.push(
          AssessmentMother.basic()
            .withId(`assessment-${i}`)
            .withOrganization('organization1')
            .withCreatedAt(date)
            .build(),
        );
      }

      const assessmentsPage2: Assessment[] = [];
      for (let i = 100; i < 150; i++) {
        assessmentsPage2.push(
          AssessmentMother.basic()
            .withId(`assessment-${i}`)
            .withOrganization('organization1')
            .withCreatedAt(date)
            .build(),
        );
      }

      vitest
        .spyOn(fakeAssessmentsRepository, 'getAll')
        .mockResolvedValueOnce({
          assessments: assessmentsPage1,
          nextToken: 'next-token-1',
        })
        .mockResolvedValueOnce({
          assessments: assessmentsPage2,
          nextToken: undefined,
        });

      vitest
        .spyOn(fakeAssessmentsRepository, 'getOpportunities')
        .mockResolvedValue([]);

      const result = await useCase.getOrganizationDetails({
        organizationDomain: 'organization1',
      });

      expect(result.totalAssessments).toBe(150);
    });
  });

  describe('should call AssessmentsRepository to extract opportunities (Id, createdAt)', () => {
    it('should fetch opportunities for the organization', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const currentYear = date.getFullYear();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(`${currentYear}-01-10`))
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(new Date(`${currentYear}-03-15`))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(result.opportunitiesPerMonth['01']).toBe(1);
      expect(result.opportunitiesPerMonth['03']).toBe(1);
    });

    it('should filter opportunities by current year', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const currentYear = date.getFullYear();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(`${currentYear}-01-10`))
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(new Date(`${currentYear - 1}-12-31`))
        .build();

      const assessment3 = AssessmentMother.basic()
        .withId('assessment-3')
        .withOrganization('test.io')
        .withOpportunityId('opp-3')
        .withOpportunityCreatedAt(new Date(`${currentYear}-05-20`))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);
      await fakeAssessmentsRepository.save(assessment3);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(result.opportunitiesPerMonth['01']).toBe(1);
      expect(result.opportunitiesPerMonth['05']).toBe(1);
      expect(result.opportunitiesPerMonth['12']).toBe(0);
    });

    it('should group opportunities by month correctly', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const currentYear = date.getFullYear();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(`${currentYear}-03-05`))
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(new Date(`${currentYear}-03-15`))
        .build();

      const assessment3 = AssessmentMother.basic()
        .withId('assessment-3')
        .withOrganization('test.io')
        .withOpportunityId('opp-3')
        .withOpportunityCreatedAt(new Date(`${currentYear}-03-25`))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);
      await fakeAssessmentsRepository.save(assessment3);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(result.opportunitiesPerMonth['03']).toBe(3);
    });
  });

  describe('should return organization details', () => {
    it('should return correct structure with totalAssessments and opportunitiesPerMonth', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const currentYear = date.getFullYear();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withCreatedAt(date)
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withCreatedAt(date)
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(`${currentYear}-01-10`))
        .build();

      const assessment3 = AssessmentMother.basic()
        .withId('assessment-3')
        .withOrganization('test.io')
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(new Date(`${currentYear}-01-20`))
        .build();

      const assessment4 = AssessmentMother.basic()
        .withId('assessment-4')
        .withOrganization('test.io')
        .withOpportunityId('opp-3')
        .withOpportunityCreatedAt(new Date(`${currentYear}-03-15`))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);
      await fakeAssessmentsRepository.save(assessment3);
      await fakeAssessmentsRepository.save(assessment4);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(result).toEqual({
        totalAssessments: 4,
        opportunitiesPerMonth: {
          '01': 2,
          '02': 0,
          '03': 1,
          '04': 0,
          '05': 0,
          '06': 0,
          '07': 0,
          '08': 0,
          '09': 0,
          '10': 0,
          '11': 0,
          '12': 0,
        },
      });
    });

    it('should handle empty assessments and opportunities', async () => {
      const { useCase } = setup();

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(result.totalAssessments).toBe(0);
      expect(
        Object.values(result.opportunitiesPerMonth).every((v) => v === 0),
      ).toBe(true);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const date = new Date();
  vitest.setSystemTime(date);

  return {
    date,
    useCase: new GetOrganizationUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
