import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { inject, reset } from '@shared/di-container';
import { mockClient } from 'aws-sdk-client-mock';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  ObjectStorageS3,
  tokenClientS3,
  tokenS3Bucket,
} from './ObjectStorageS3';

describe('ObjectStorage Infrastructure', () => {
  describe('list', () => {
    it('should return an empty list when no objects are found', async () => {
      const { objectStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(ListObjectsV2Command).resolves({
        Contents: [],
        $metadata: { httpStatusCode: 200 },
      });
      await expect(objectStorage.list({ prefix: 'prefix' })).resolves.toEqual(
        []
      );

      const listExecutionCalls =
        s3ClientMock.commandCalls(ListObjectsV2Command);
      expect(listExecutionCalls).toHaveLength(1);
      const listExecutionCall = listExecutionCalls[0];
      expect(listExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Prefix: 'prefix',
      });
    });

    it('should return a list of objects', async () => {
      const { objectStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(ListObjectsV2Command).resolves({
        Contents: [{ Key: 'prefix/key1' }, { Key: 'prefix/key2' }],
        $metadata: { httpStatusCode: 200 },
      });
      await expect(objectStorage.list({ prefix: 'prefix' })).resolves.toEqual([
        'prefix/key1',
        'prefix/key2',
      ]);

      const listExecutionCalls =
        s3ClientMock.commandCalls(ListObjectsV2Command);
      expect(listExecutionCalls).toHaveLength(1);
      const listExecutionCall = listExecutionCalls[0];
      expect(listExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Prefix: 'prefix',
      });
    });

    it('should throw an error when list fails', async () => {
      const { objectStorage, s3ClientMock } = setup();

      s3ClientMock.on(ListObjectsV2Command).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(objectStorage.list({ prefix: 'prefix' })).rejects.toThrow(
        Error
      );
    });
  });
  describe('bulkDelete', () => {
    it('should delete a list of objects', async () => {
      const { objectStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(DeleteObjectsCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      await objectStorage.bulkDelete({ keys: ['key1', 'key2'] });

      const bulkDeleteExecutionCalls =
        s3ClientMock.commandCalls(DeleteObjectsCommand);
      expect(bulkDeleteExecutionCalls).toHaveLength(1);
      const deleteExecutionCall = bulkDeleteExecutionCalls[0];
      expect(deleteExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Delete: {
          Objects: [{ Key: 'key1' }, { Key: 'key2' }],
          Quiet: true,
        },
      });
    });

    it('should throw an error when object fails to delete', async () => {
      const { objectStorage, s3ClientMock } = setup();

      s3ClientMock.on(DeleteObjectsCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        objectStorage.bulkDelete({ keys: ['key1', 'key2'] })
      ).rejects.toThrow(Error);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const objectStorage = new ObjectStorageS3();
  const s3ClientMock = mockClient(inject(tokenClientS3));
  return {
    objectStorage,
    bucket: inject(tokenS3Bucket),
    s3ClientMock,
  };
};
