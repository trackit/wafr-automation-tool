import { AIBestPracticeMetadata, AIFinding } from '../AI';

export interface PromptVariables {
  scanningToolTitle: string;
  questionSetData: AIBestPracticeMetadata[];
  scanningToolData: AIFinding[];
}
