import { Pillar, Question, QuestionSet, RawQuestionSet } from '@backend/models';
import { QuestionSetPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';
import { parseJson } from '@shared/utils';
import fs from 'fs';
import path from 'path';

export class QuestionSetService implements QuestionSetPort {
  private getRawQuestionSet(): {
    rawQuestionSet: RawQuestionSet;
    version: string;
  } {
    const files = fs
      .readdirSync('./questions')
      .filter((name) => /^questions_\d{8}\.json$/.test(name));
    if (files.length === 0) {
      throw new Error('No question set found');
    }
    files.sort((a, b) => {
      const parseDate = (filename: string): number => {
        const match = filename.match(/^questions_(\d{2})(\d{2})(\d{4})\.json$/);
        if (!match) return 0;
        const [, mm, dd, yyyy] = match;
        return new Date(`${yyyy}-${mm}-${dd}`).getTime();
      };
      return parseDate(a) - parseDate(b);
    });
    const latestFile = files[files.length - 1];
    const version = path.basename(latestFile, '.json');
    return {
      rawQuestionSet: parseJson(
        fs.readFileSync(path.join('./questions', latestFile), 'utf8')
      ) as RawQuestionSet,
      version,
    };
  }

  private formatQuestionSet(
    rawQuestionSet: RawQuestionSet,
    version: string
  ): QuestionSet {
    const questionSet: QuestionSet = { data: {}, version };
    for (const [pillarId, rawPillar] of Object.entries(rawQuestionSet)) {
      const pillar: Pillar = {
        disabled: false,
        id: pillarId,
        label: rawPillar.label,
        primaryId: rawPillar.primary_id,
        questions: {},
      };
      for (const [questionId, rawQuestion] of Object.entries(
        rawPillar.questions
      )) {
        const question: Question = {
          bestPractices: {},
          disabled: false,
          id: questionId,
          label: rawQuestion.label,
          none: false,
          primaryId: rawQuestion.primary_id,
        };
        for (const [bestPracticeId, rawBestPractice] of Object.entries(
          rawQuestion.best_practices
        )) {
          question.bestPractices[bestPracticeId] = {
            ...{ ...rawBestPractice, primary_id: undefined },
            id: bestPracticeId,
            primaryId: rawBestPractice.primary_id,
            results: [],
            checked: false,
          };
        }
        pillar.questions[questionId] = question;
      }
      questionSet.data[pillarId] = pillar;
    }
    return questionSet;
  }

  public get(): QuestionSet {
    const { rawQuestionSet, version } = this.getRawQuestionSet();
    return this.formatQuestionSet(rawQuestionSet, version);
  }
}

export const tokenQuestionSet = createInjectionToken<QuestionSetService>(
  'QuestionSet',
  {
    useClass: QuestionSetService,
  }
);
