import { Pillar, SeverityType } from '@backend/models';
import { reset } from '@shared/di-container';

import { QuestionSetService, RawQuestionSet } from './QuestionSetService';

describe('QuestionSetService', () => {
  describe('get', () => {
    it('should get the lastest version of the question set', async () => {
      const { questionSetService } = setup();

      const questionSet = questionSetService.get();

      const questionSetData: Pillar[] = [
        {
          primaryId: 'pillar-id',
          label: 'pillar-label',
          disabled: false,
          id: '0',
          questions: [
            {
              bestPractices: [
                {
                  id: '0',
                  primaryId: 'best-practice-id',
                  label: 'best-practice-label',
                  risk: SeverityType.High,
                  description: 'best-practice-description',
                  findings: [],
                  checked: false,
                },
              ],
              disabled: false,
              id: '0',
              label: 'question-label',
              none: false,
              primaryId: 'question-id',
            },
          ],
        },
      ];

      expect(questionSet.pillars).toEqual(questionSetData);
      expect(questionSet.version).toEqual('questions_05072025');
    });
  });
});

const setup = () => {
  reset();
  vi.mock(
    '../../../../../../scripts/questions/questions_05072025.json',
    () => ({
      default: {
        '0': {
          primaryId: 'pillar-id',
          label: 'pillar-label',
          questions: {
            '0': {
              primaryId: 'question-id',
              label: 'question-label',
              bestPractices: {
                '0': {
                  primaryId: 'best-practice-id',
                  label: 'best-practice-label',
                  risk: SeverityType.High,
                  description: 'best-practice-description',
                },
              },
            },
          },
        },
      } as RawQuestionSet,
    })
  );
  return {
    questionSetService: new QuestionSetService(),
  };
};
