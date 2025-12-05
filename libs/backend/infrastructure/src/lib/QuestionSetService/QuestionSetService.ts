import { type Pillar, type Question, type QuestionSet, type SeverityType } from '@backend/models';
import { type QuestionSetPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

// eslint-disable-next-line @nx/enforce-module-boundaries
import question from '../../../../../../scripts/questions/questions_05072025.json';

interface RawBestPractice {
  primaryId: string;
  label: string;
  description: string;
  risk: SeverityType;
}

interface RawQuestion {
  primaryId: string;
  label: string;
  bestPractices: Record<string, RawBestPractice>;
}

interface RawPillar {
  primaryId: string;
  label: string;
  questions: Record<string, RawQuestion>;
}

export type RawQuestionSet = Record<string, RawPillar>;

export class QuestionSetService implements QuestionSetPort {
  private getRawQuestionSet(): {
    rawQuestionSet: RawQuestionSet;
    version: string;
  } {
    // const files = fs
    //   .readdirSync('./questions')
    //   .filter((name) => /^questions_\d{8}\.json$/.test(name));
    // if (files.length === 0) {
    //   throw new Error('No question set found');
    // }
    // files.sort((a, b) => {
    //   const parseDate = (filename: string): number => {
    //     const match = filename.match(/^questions_(\d{2})(\d{2})(\d{4})\.json$/);
    //     if (!match) return 0;
    //     const [, mm, dd, yyyy] = match;
    //     return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    //   };
    //   return parseDate(a) - parseDate(b);
    // });
    // const latestFile = files[files.length - 1];
    const version = 'questions_05072025';
    return {
      rawQuestionSet: question as RawQuestionSet,
      version,
    };
  }

  private formatQuestionSet(
    rawQuestionSet: RawQuestionSet,
    version: string,
  ): QuestionSet {
    const questionSet: QuestionSet = { pillars: [], version };
    for (const [pillarId, rawPillar] of Object.entries(rawQuestionSet)) {
      const pillar: Pillar = {
        disabled: false,
        id: pillarId,
        label: rawPillar.label,
        primaryId: rawPillar.primaryId,
        questions: [],
      };
      for (const [questionId, rawQuestion] of Object.entries(
        rawPillar.questions,
      )) {
        const question: Question = {
          bestPractices: [],
          disabled: false,
          id: questionId,
          label: rawQuestion.label,
          none: false,
          primaryId: rawQuestion.primaryId,
        };
        for (const [bestPracticeId, rawBestPractice] of Object.entries(
          rawQuestion.bestPractices,
        )) {
          question.bestPractices.push({
            ...{ ...rawBestPractice, primaryId: undefined },
            id: bestPracticeId,
            primaryId: rawBestPractice.primaryId,
            checked: false,
          });
        }
        pillar.questions.push(question);
      }
      questionSet.pillars.push(pillar);
    }
    return questionSet;
  }

  public get(): QuestionSet {
    const { rawQuestionSet, version } = this.getRawQuestionSet();
    return this.formatQuestionSet(rawQuestionSet, version);
  }
}

export const tokenQuestionSetService = createInjectionToken<QuestionSetPort>(
  'QuestionSetService',
  {
    useClass: QuestionSetService,
  },
);
