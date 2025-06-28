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

  public withAssessmentId(
    assessmentId: InvokeLLMInput['assessmentId']
  ): InvokeLLMAdapterEventMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: InvokeLLMInput['organization']
  ): InvokeLLMAdapterEventMother {
    this.data.organization = organization;
    return this;
  }

  public withPromptArn(
    prompt_arn: InvokeLLMInput['promptArn']
  ): InvokeLLMAdapterEventMother {
    this.data.promptArn = prompt_arn;
    return this;
  }

  public withPromptUri(
    prompt_uri: InvokeLLMInput['promptUri']
  ): InvokeLLMAdapterEventMother {
    this.data.promptUri = prompt_uri;
    return this;
  }

  public build(): InvokeLLMInput {
    return this.data;
  }
}
