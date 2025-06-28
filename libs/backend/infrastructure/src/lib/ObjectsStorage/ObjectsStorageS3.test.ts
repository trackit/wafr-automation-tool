import {
  DeleteObjectsCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { inject, reset } from '@shared/di-container';
import { mockClient } from 'aws-sdk-client-mock';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  ObjectsStorageS3,
  tokenClientS3,
  tokenS3Bucket,
} from './ObjectsStorageS3';

describe('ObjectsStorage Infrastructure', () => {
  describe('get', () => {
    it('should get an object', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(GetObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      await expect(objectsStorage.get({ key: 'key' })).resolves.toEqual('');

      const getExecutionCalls = s3ClientMock.commandCalls(GetObjectCommand);
      expect(getExecutionCalls).toHaveLength(1);
      const getExecutionCall = getExecutionCalls[0];
      expect(getExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Key: 'key',
      });
    });

    it('should throw an exception if the object has failed to be retrieved', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(GetObjectCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(objectsStorage.get({ key: 'key' })).rejects.toThrow(Error);
    });
  });
  describe('list', () => {
    it('should return an empty list when no objects are found', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(ListObjectsV2Command).resolves({
        Contents: [],
        $metadata: { httpStatusCode: 200 },
      });
      await expect(objectsStorage.list({ prefix: 'prefix' })).resolves.toEqual(
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
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(ListObjectsV2Command).resolves({
        Contents: [{ Key: 'prefix/key1' }, { Key: 'prefix/key2' }],
        $metadata: { httpStatusCode: 200 },
      });
      await expect(objectsStorage.list({ prefix: 'prefix' })).resolves.toEqual([
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
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(ListObjectsV2Command).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(objectsStorage.list({ prefix: 'prefix' })).rejects.toThrow(
        Error
      );
    });
  });
  describe('bulkDelete', () => {
    it('should delete a list of objects', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(DeleteObjectsCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      await objectsStorage.bulkDelete({ keys: ['key1', 'key2'] });

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
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(DeleteObjectsCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        objectsStorage.bulkDelete({ keys: ['key1', 'key2'] })
      ).rejects.toThrow(Error);
    });

    it('should not call client send if keys array is empty', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      await objectsStorage.bulkDelete({ keys: [] });

      const bulkDeleteExecutionCalls =
        s3ClientMock.commandCalls(DeleteObjectsCommand);
      expect(bulkDeleteExecutionCalls).toHaveLength(0);
    });
  });

  describe('put', () => {
    it('should put an object', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(PutObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      await objectsStorage.put({ key: 'test-key', body: 'test-body' });

      const putExecutionCalls = s3ClientMock.commandCalls(PutObjectCommand);
      expect(putExecutionCalls).toHaveLength(1);
      const putExecutionCall = putExecutionCalls[0];
      expect(putExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Key: 'test-key',
        Body: 'test-body',
      });
    });

    it('should throw an exception if put object fail', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(PutObjectCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        objectsStorage.put({ key: 'test-key', body: 'test-body' })
      ).rejects.toThrow('Failed to put object: 500');
    });
  });

  describe('parseURI', () => {
    it('should parse a URI into a bucket and key', () => {
      const { objectsStorage } = setup();

      const { bucket, key } = objectsStorage.parseURI(
        's3://test-s3-bucket/key'
      );
      expect(bucket).toEqual('test-s3-bucket');
      expect(key).toEqual('key');
    });

    it('should throw an error if the URI is invalid', () => {
      const { objectsStorage } = setup();

      expect(() => objectsStorage.parseURI('invalid-uri')).toThrow(Error);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const objectsStorage = new ObjectsStorageS3();
  const s3ClientMock = mockClient(inject(tokenClientS3));
  return {
    objectsStorage,
    bucket: inject(tokenS3Bucket),
    s3ClientMock,
  };
};
