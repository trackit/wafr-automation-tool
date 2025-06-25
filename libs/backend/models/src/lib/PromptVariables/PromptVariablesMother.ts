import { AIBestPracticeMetadata } from '../AI';
import { Finding } from '../Finding';
import type { PromptVariables } from './PromptVariables';

export class PromptVariablesMother {
  private data: PromptVariables;

  private constructor(data: PromptVariables) {
    this.data = data;
  }

  public static basic(): PromptVariablesMother {
    return new PromptVariablesMother({
      scanningToolTitle: 'Scanning Tool Title',
      questionSetData: [],
      scanningToolData: [],
    });
  }

  public withScanningToolTitle(
    scanningToolTitle: string
  ): PromptVariablesMother {
    this.data.scanningToolTitle = scanningToolTitle;
    return this;
  }

  public withQuestionSetData(
    questionSetData: AIBestPracticeMetadata[]
  ): PromptVariablesMother {
    this.data.questionSetData = questionSetData;
    return this;
  }

  public withScanningToolData(
    scanningToolData: Finding[]
  ): PromptVariablesMother {
    this.data.scanningToolData = scanningToolData;
    return this;
  }

  public build(): PromptVariables {
    return this.data;
  }
}
