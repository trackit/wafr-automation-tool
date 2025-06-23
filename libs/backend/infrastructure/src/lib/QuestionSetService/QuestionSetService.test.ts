import { QuestionSet, RawQuestionSet, SeverityType } from '@backend/models';
import { reset } from '@shared/di-container';
import fs from 'fs';
import { QuestionSetService } from './QuestionSetService';

describe('QuestionSet Infrastructure', () => {
  describe('get', () => {
    it('should get the lastest version of the question set', async () => {
      const { questionSetService } = setup();
      const mockFiles = [
        'questions_20230615.json',
        'questions_20230620.json',
        'questions_20230625.json',
      ] as string[];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      vi.spyOn(fs, 'readdirSync').mockReturnValue(mockFiles);

      const mockFileContent: RawQuestionSet = {
        '0': {
          primary_id: 'pillar-id',
          label: 'pillar-label',
          questions: {
            '0': {
              primary_id: 'question-id',
              label: 'question-label',
              best_practices: {
                '0': {
                  primary_id: 'best-practice-id',
                  label: 'best-practice-label',
                  risk: SeverityType.High,
                  description: 'best-practice-description',
                },
              },
            },
          },
        },
      };
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(mockFileContent)
      );

      const questionSet = questionSetService.get();

      const questionSetData: QuestionSet['data'] = [
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
                  results: [],
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
      expect(questionSet.data).toEqual(questionSetData);
      expect(questionSet.version).toEqual('questions_20230625');
    });
  });
});

const setup = () => {
  reset();
  vi.mock('fs');
  return {
    questionSetService: new QuestionSetService(),
  };
};
