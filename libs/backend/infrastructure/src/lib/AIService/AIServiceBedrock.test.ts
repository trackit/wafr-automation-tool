import {
  ConverseStreamCommand,
  ConverseStreamOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { mockClient } from 'aws-sdk-client-mock';

import { inject, reset } from '@shared/di-container';

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

      const promptText = 'Hello world';

      bedrockRuntimeClientMock.on(ConverseStreamCommand).resolves({
        stream: (async function* () {
          for (const chunk of fakeChunks) {
            yield chunk as ConverseStreamOutput;
          }
        })(),
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        aiServiceBedrock.converse({ prompt: [{ text: promptText }] }),
      ).resolves.toEqual(promptText);

      const converseStreamCalls = bedrockRuntimeClientMock.commandCalls(
        ConverseStreamCommand,
      );
      expect(converseStreamCalls).toHaveLength(1);
      const converseExecutionCall = converseStreamCalls[0];
      expect(converseExecutionCall.args[0].input).toEqual(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: [
                {
                  text: promptText,
                },
              ],
            },
          ],
        }),
      );
    });

    it('should throw an exception if the converse stream fails', async () => {
      const { aiServiceBedrock, bedrockRuntimeClientMock } = setup();

      const promptText = 'Hello world';

      bedrockRuntimeClientMock.on(ConverseStreamCommand).resolves({
        stream: (async function* () {
          for (const chunk of fakeChunks) {
            yield chunk as ConverseStreamOutput;
          }
        })(),
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        aiServiceBedrock.converse({ prompt: [{ text: promptText }] }),
      ).rejects.toThrow(Error);
    });

    it('should throw an exception if the converse stream return an undefined stream', async () => {
      const { aiServiceBedrock, bedrockRuntimeClientMock } = setup();

      const promptText = 'Hello world';

      bedrockRuntimeClientMock.on(ConverseStreamCommand).resolves({
        stream: undefined,
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        aiServiceBedrock.converse({ prompt: [{ text: promptText }] }),
      ).rejects.toThrow(Error);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const bedrockRuntimeClientMock = mockClient(
    inject(tokenClientBedrockRuntime),
  );

  return {
    aiServiceBedrock: new AIServiceBedrock(),
    bedrockRuntimeClientMock,
  };
};
