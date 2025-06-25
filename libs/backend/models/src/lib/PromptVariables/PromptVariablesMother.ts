import type { PromptVariables } from './PromptVariables';

export class PromptVariablesMother {
  private data: PromptVariables;

  private constructor(data: PromptVariables) {
    this.data = data;
  }

  public static basic(): PromptVariablesMother {
    return new PromptVariablesMother({
      scanningToolTitle: 'Scanning Tool Title',
      questionSetData: 'Question Set Data',
      scanningToolData: 'Scanning Tool Data',
    });
  }

  public withScanningToolTitle(
    scanningToolTitle: string
  ): PromptVariablesMother {
    this.data.scanningToolTitle = scanningToolTitle;
    return this;
  }

  public withQuestionSetData(questionSetData: string): PromptVariablesMother {
    this.data.questionSetData = questionSetData;
    return this;
  }

  public withScanningToolData(scanningToolData: string): PromptVariablesMother {
    this.data.scanningToolData = scanningToolData;
    return this;
  }

  public build(): PromptVariables {
    return this.data;
  }
}
