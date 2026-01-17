import { type Finding, type Pillar, type ScanningTool } from '@backend/models';

import { type AIInferenceConfig } from './AIService';

export interface FindingToBestPracticesAssociation {
  finding: Finding;
  bestPractices: {
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }[];
}

export interface FindingToBestPracticesAssociationService {
  associateFindingsToBestPractices(args: {
    scanningTool: ScanningTool;
    findings: Finding[];
    pillars: Pillar[];
    inferenceConfig?: AIInferenceConfig;
  }): Promise<FindingToBestPracticesAssociation[]>;
}
