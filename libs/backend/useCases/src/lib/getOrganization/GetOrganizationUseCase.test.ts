import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { type Assessment, AssessmentMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  GetOrganizationUseCaseImpl,
  type OpportunitiesPerMonthItem,
} from './GetOrganizationUseCase';
import { GetOrganizationUseCaseArgsMother } from './GetOrganizationUseCaseArgsMother';

vitest.useFakeTimers();

const findMonth = (arr: OpportunitiesPerMonthItem[], month: string) =>
  arr.find((m) => m.month === month)?.opportunities ?? 0;

const buildLast12Months = (now: Date) => {
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });
};

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

      expect(result.currentYearTotalAssessments).toBe(2);
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

      vitest
        .spyOn(fakeAssessmentsRepository, 'countAssessmentsByYear')
        .mockResolvedValueOnce(100);

      vitest
        .spyOn(fakeAssessmentsRepository, 'getOpportunitiesByYear')
        .mockResolvedValue([]);

      const result = await useCase.getOrganizationDetails({
        organizationDomain: 'organization1',
      });

      expect(result.currentYearTotalAssessments).toBe(100);
    });
  });

  describe('should call AssessmentsRepository to extract opportunities (id, createdAt)', () => {
    it('should fetch opportunities for the organization', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const months = buildLast12Months(date);
      const firstMonth = months[0];
      const thirdMonth = months[2];

      const [fmMM, fmYYYY] = firstMonth.split('-').map(Number);
      const [tmMM, tmYYYY] = thirdMonth.split('-').map(Number);

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(`${fmYYYY}-${fmMM}-10`))
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(new Date(`${tmYYYY}-${tmMM}-15`))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(findMonth(result.opportunitiesPerMonth, firstMonth)).toBe(1);
      expect(findMonth(result.opportunitiesPerMonth, thirdMonth)).toBe(1);
    });

    it('should filter opportunities by last 12 months (not include older ones)', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const months = buildLast12Months(date);
      const startMonth = months[0];
      const midMonth = months[6];
      const [smMM, smYYYY] = startMonth.split('-').map(Number);
      const [mmMM, mmYYYY] = midMonth.split('-').map(Number);

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(`${smYYYY}-${smMM}-10`))
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(new Date(smYYYY, smMM - 2, 15))
        .build();

      const assessment3 = AssessmentMother.basic()
        .withId('assessment-3')
        .withOrganization('test.io')
        .withOpportunityId('opp-3')
        .withOpportunityCreatedAt(new Date(`${mmYYYY}-${mmMM}-20`))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);
      await fakeAssessmentsRepository.save(assessment3);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(findMonth(result.opportunitiesPerMonth, startMonth)).toBe(1);
      expect(findMonth(result.opportunitiesPerMonth, midMonth)).toBe(1);
      expect(
        findMonth(
          result.opportunitiesPerMonth,
          `${smYYYY}-${String(smMM + 1)}`,
        ),
      ).toBe(0);
    });

    it('should group opportunities by month correctly', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const months = buildLast12Months(date);
      const targetMonth = months[3];
      const [mm, yyyy] = targetMonth.split('-').map(Number);

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(yyyy, mm - 1, 5))
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(new Date(yyyy, mm - 1, 15))
        .build();

      const assessment3 = AssessmentMother.basic()
        .withId('assessment-3')
        .withOrganization('test.io')
        .withOpportunityId('opp-3')
        .withOpportunityCreatedAt(new Date(yyyy, mm - 1, 25))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);
      await fakeAssessmentsRepository.save(assessment3);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(findMonth(result.opportunitiesPerMonth, targetMonth)).toBe(3);
    });

    it('should filter opportunities to the last 12 months window', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const months = buildLast12Months(date);
      const startMonth = months[0];
      const excludedBeforeWindow = new Date(
        date.getFullYear(),
        date.getMonth() - 12,
        15,
      );
      const [smMM, smYYYY] = startMonth.split('-').map(Number);

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(`${smYYYY}-${smMM}-10`))
        .build();

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(excludedBeforeWindow)
        .build();

      const assessment3 = AssessmentMother.basic()
        .withId('assessment-3')
        .withOrganization('test.io')
        .withOpportunityId('opp-3')
        .withOpportunityCreatedAt(new Date(`${smYYYY}-${smMM}-20`))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);
      await fakeAssessmentsRepository.save(assessment3);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(findMonth(result.opportunitiesPerMonth, startMonth)).toBe(2);
      const excludedKey = `${String(excludedBeforeWindow.getMonth() - 12).padStart(2, '0')}-${excludedBeforeWindow.getFullYear()}`;
      expect(findMonth(result.opportunitiesPerMonth, excludedKey)).toBe(0);
    });
  });

  describe('should return organization details', () => {
    it('should return correct structure with currentYearTotalAssessments and opportunitiesPerMonth', async () => {
      const { useCase, fakeAssessmentsRepository, date } = setup();
      const months = buildLast12Months(date);

      const assessment1 = AssessmentMother.basic()
        .withId('assessment-1')
        .withOrganization('test.io')
        .withCreatedAt(date)
        .build();

      const [fmMM, fmYYYY] = months[0].split('-').map(Number);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment-2')
        .withOrganization('test.io')
        .withCreatedAt(date)
        .withOpportunityId('opp-1')
        .withOpportunityCreatedAt(new Date(fmYYYY, fmMM - 1, 10))
        .build();

      const assessment3 = AssessmentMother.basic()
        .withId('assessment-3')
        .withOrganization('test.io')
        .withCreatedAt(date)
        .withOpportunityId('opp-2')
        .withOpportunityCreatedAt(new Date(fmYYYY, fmMM - 1, 20))
        .build();

      const [tmMM, tmYYYY] = months[2].split('-').map(Number);

      const assessment4 = AssessmentMother.basic()
        .withId('assessment-4')
        .withOrganization('test.io')
        .withCreatedAt(date)
        .withOpportunityId('opp-3')
        .withOpportunityCreatedAt(new Date(tmYYYY, tmMM - 1, 15))
        .build();

      await fakeAssessmentsRepository.save(assessment1);
      await fakeAssessmentsRepository.save(assessment2);
      await fakeAssessmentsRepository.save(assessment3);
      await fakeAssessmentsRepository.save(assessment4);

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(result.currentYearTotalAssessments).toBe(4);

      expect(findMonth(result.opportunitiesPerMonth, months[0])).toBe(2);
      expect(findMonth(result.opportunitiesPerMonth, months[1])).toBe(0);
      expect(findMonth(result.opportunitiesPerMonth, months[2])).toBe(1);

      for (const m of months) {
        expect(typeof findMonth(result.opportunitiesPerMonth, m)).toBe(
          'number',
        );
      }
    });

    it('should handle empty assessments and opportunities', async () => {
      const { useCase } = setup();

      const args = GetOrganizationUseCaseArgsMother.basic().build();
      const result = await useCase.getOrganizationDetails(args);

      expect(result.currentYearTotalAssessments).toBe(0);
      expect(
        result.opportunitiesPerMonth.every((m) => m.opportunities === 0),
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
