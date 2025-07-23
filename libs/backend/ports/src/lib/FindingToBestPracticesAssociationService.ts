import { InferenceConfiguration } from '@aws-sdk/client-bedrock-runtime';
import { Finding, Pillar, ScanningTool } from '@backend/models';

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
