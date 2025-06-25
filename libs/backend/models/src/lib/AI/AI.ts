import { z } from 'zod';

export const AIFindingAssociationSchema = z.object({
  id: z.number(),
  start: z.number(),
  end: z.number(),
});

export const AIFindingAssociationListSchema =
  AIFindingAssociationSchema.array();

export type AIFindingAssociation = z.infer<typeof AIFindingAssociationSchema>;

export interface AIBestPracticeMetadata {
  globalId: number;
  pillarLabel: string;
  questionLabel: string;
  bestPracticeLabel: string;
  bestPracticeDescription: string;
}

export interface AIBestPracticeAssociation {
  globalId: number;
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
  bestPracticeFindingNumberIds: number[];
}
