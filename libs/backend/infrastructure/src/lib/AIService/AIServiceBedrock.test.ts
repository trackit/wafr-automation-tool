import { mockClient } from 'aws-sdk-client-mock';

import { inject, reset } from '@shared/di-container';

import {
  ConverseStreamCommand,
  ConverseStreamOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  AIServiceBedrock,
  tokenClientBedrockRuntime,
} from './AIServiceBedrock';

const fakeChunks: Partial<ConverseStreamOutput>[] = [
  {
    contentBlockDelta: {
      delta: { text: 'Hello' },
      contentBlockIndex: undefined,
    },
  },
  {
    contentBlockDelta: {
      delta: { text: ' world' },
      contentBlockIndex: undefined,
    },
  },
];

describe('AIService Infrastructure', () => {
  describe('converse', () => {
    it('should call bedrock converse stream with proper parameters', async () => {
      const { aiServiceBedrock, bedrockRuntimeClientMock } = setup();

      bedrockRuntimeClientMock.on(ConverseStreamCommand).resolves({
        stream: (async function* () {
          for (const chunk of fakeChunks) {
            yield chunk as ConverseStreamOutput;
          }
        })(),
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        aiServiceBedrock.converse({
          promptArn:
            'arn:aws:bedrock:us-east-1:123456789012:prompt/test-prompt',
          promptVariables: {
            var1: {
              subVar1: 'value1',
              subVar2: 'value2',
            },
            var2: 'value2',
          },
        })
      ).resolves.toEqual('Hello world');

      const converseStreamCalls = bedrockRuntimeClientMock.commandCalls(
        ConverseStreamCommand
      );
      expect(converseStreamCalls).toHaveLength(1);
      const converseExecutionCall = converseStreamCalls[0];
      expect(converseExecutionCall.args[0].input).toEqual({
        modelId: 'arn:aws:bedrock:us-east-1:123456789012:prompt/test-prompt',
        promptVariables: {
          var1: {
            text: JSON.stringify({ subVar1: 'value1', subVar2: 'value2' }),
          },
          var2: { text: JSON.stringify('value2') },
        },
      });
    });

    it('should throw an exception if the converse stream fails', async () => {
      const { aiServiceBedrock, bedrockRuntimeClientMock } = setup();

      bedrockRuntimeClientMock.on(ConverseStreamCommand).resolves({
        stream: (async function* () {
          for (const chunk of fakeChunks) {
            yield chunk as ConverseStreamOutput;
          }
        })(),
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        aiServiceBedrock.converse({
          promptArn:
            'arn:aws:bedrock:us-east-1:123456789012:prompt/test-prompt',
          promptVariables: { var1: 'value1' },
        })
      ).rejects.toThrow(Error);
    });

    it('should throw an exception if the converse stream return an undefined stream', async () => {
      const { aiServiceBedrock, bedrockRuntimeClientMock } = setup();

      bedrockRuntimeClientMock.on(ConverseStreamCommand).resolves({
        stream: undefined,
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        aiServiceBedrock.converse({
          promptArn:
            'arn:aws:bedrock:us-east-1:123456789012:prompt/test-prompt',
          promptVariables: { var1: 'value1' },
        })
      ).rejects.toThrow(Error);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const aiServiceBedrock = new AIServiceBedrock();
  const bedrockRuntimeClientMock = mockClient(
    inject(tokenClientBedrockRuntime)
  );
  return {
    aiServiceBedrock,
    bedrockRuntimeClientMock,
  };
};
