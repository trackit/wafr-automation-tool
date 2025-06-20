import { InvokeLLMInput } from './invokeLLM';

export class InvokeLLMAdapterEventMother {
  private data: InvokeLLMInput;

  private constructor(data: InvokeLLMInput) {
    this.data = data;
  }

  public static basic(): InvokeLLMAdapterEventMother {
    return new InvokeLLMAdapterEventMother({
      assessmentId: 'assessment-id',
      organization: 'test.io',
      promptArn: 'prompt-arn',
      promptUri: 'prompt-uri',
    });
  }

  public withAssessmentId(assessmentId: string): InvokeLLMAdapterEventMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(organization: string): InvokeLLMAdapterEventMother {
    this.data.organization = organization;
    return this;
  }

  public withPromptArn(promptArn: string): InvokeLLMAdapterEventMother {
    this.data.promptArn = promptArn;
    return this;
  }

  public withPromptUri(promptUri: string): InvokeLLMAdapterEventMother {
    this.data.promptUri = promptUri;
    return this;
  }

  public build(): InvokeLLMInput {
    return this.data;
  }
}
