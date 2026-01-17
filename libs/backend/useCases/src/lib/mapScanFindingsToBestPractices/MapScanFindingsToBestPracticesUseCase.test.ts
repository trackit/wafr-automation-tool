import { registerTestInfrastructure } from '@backend/infrastructure';
import {
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  ScanFindingMother,
} from '@backend/models';
import { reset } from '@shared/di-container';

import { MapScanFindingsToBestPracticesUseCaseImpl } from './MapScanFindingsToBestPracticesUseCase';
import { MapScanFindingsToBestPracticesUseCaseArgsMother } from './MapScanFindingsToBestPracticesUseCaseArgsMother';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

import { readFileSync } from 'node:fs';
const mockedReadFileSync = vi.mocked(readFileSync);

describe('MapScanFindingsToBestPracticesUseCase', () => {
  it('should return empty best practices arrays if no mapping exists', async () => {
    const { useCase } = setup();
    mockedReadFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    const mockedScanFindings = [
      ScanFindingMother.basic().withId('tool#1').build(),
      ScanFindingMother.basic().withId('tool#2').build(),
    ];

    const input = MapScanFindingsToBestPracticesUseCaseArgsMother.basic()
      .withScanFindings(mockedScanFindings)
      .build();

    const result = await useCase.mapScanFindingsToBestPractices(input);

    expect(result).toEqual([
      { scanFinding: mockedScanFindings[0], bestPractices: [] },
      { scanFinding: mockedScanFindings[1], bestPractices: [] },
    ]);
  });

  it('should map scan findings to best practices when it is possible', async () => {
    const { useCase } = setup();

    const mockedScanFindings = [
      ScanFindingMother.basic()
        .withId('tool#1')
        .withEventCode('eventCode1')
        .build(),
      ScanFindingMother.basic()
        .withId('tool#2')
        .withEventCode('eventCode2')
        .build(),
      ScanFindingMother.basic()
        .withId('tool#3')
        .withEventCode('eventCode3')
        .build(),
    ];

    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        eventCode1: [
          {
            pillar: 'security',
            question: 'securely-operate',
            bestPractice: 'sec_securely_operate_multi_accounts',
          },
          {
            pillar: 'security',
            question: 'permissions',
            bestPractice: 'sec_permissions_define_guardrails',
          },
        ],
        eventCode2: [
          {
            pillar: 'security',
            question: 'securely-operate',
            bestPractice: 'sec_securely_operate_aws_account',
          },
        ],
      }),
    );

    const input = MapScanFindingsToBestPracticesUseCaseArgsMother.basic()
      .withScanFindings(mockedScanFindings)
      .withPillars([
        PillarMother.basic()
          .withId('pillar-1')
          .withPrimaryId('security')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withPrimaryId('securely-operate')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('best-practice-1')
                  .withPrimaryId('sec_securely_operate_multi_accounts')
                  .build(),
                BestPracticeMother.basic()
                  .withId('best-practice-2')
                  .withPrimaryId('sec_securely_operate_aws_account')
                  .build(),
              ])
              .build(),
            QuestionMother.basic()
              .withId('question-2')
              .withPrimaryId('permissions')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('best-practice-3')
                  .withPrimaryId('sec_permissions_define_guardrails')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ])
      .build();

    const result = await useCase.mapScanFindingsToBestPractices(input);

    expect(result).toEqual([
      {
        scanFinding: mockedScanFindings[0],
        bestPractices: [
          {
            pillarId: input.pillars[0].id,
            questionId: input.pillars[0].questions[0].id,
            bestPracticeId: input.pillars[0].questions[0].bestPractices[0].id,
          },
          {
            pillarId: input.pillars[0].id,
            questionId: input.pillars[0].questions[1].id,
            bestPracticeId: input.pillars[0].questions[1].bestPractices[0].id,
          },
        ],
      },
      {
        scanFinding: mockedScanFindings[1],
        bestPractices: [
          {
            pillarId: input.pillars[0].id,
            questionId: input.pillars[0].questions[0].id,
            bestPracticeId: input.pillars[0].questions[0].bestPractices[1].id,
          },
        ],
      },
      {
        scanFinding: mockedScanFindings[2],
        bestPractices: [],
      },
    ]);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  mockedReadFileSync.mockReset();

  return {
    useCase: new MapScanFindingsToBestPracticesUseCaseImpl(),
  };
};
