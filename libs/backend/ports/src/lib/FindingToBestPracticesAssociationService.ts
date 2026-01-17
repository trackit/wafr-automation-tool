import { type InferenceConfiguration } from '@aws-sdk/client-bedrock-runtime';

import { type Finding, type Pillar, type ScanningTool } from '@backend/models';

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
    inferenceConfig?: InferenceConfiguration;
  }): Promise<FindingToBestPracticesAssociation[]>;
}
