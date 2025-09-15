import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

import { inject, reset } from '@shared/di-container';
import { stringToStream } from '@shared/utils';

import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  ObjectsStorageS3,
  tokenClientS3,
  tokenS3Bucket,
} from './ObjectsStorageS3';

describe('ObjectsStorage Infrastructure', () => {
  describe('get', () => {
    it('should get an object', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(GetObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
        Body: stringToStream('object-content') as any,
      });

      await expect(objectsStorage.get('assessment-id')).resolves.toBe(
        'object-content'
      );
    });

    it('should return null if object does not exist', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(GetObjectCommand).rejects(
        new S3ServiceException({
          name: 'NoSuchKey',
          $fault: 'client',
          $metadata: { httpStatusCode: 404 },
        })
      );

      await expect(
        objectsStorage.get('non-existent-assessment-id')
      ).resolves.toBeNull();
    });

    it('should throw an error if get object fails', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(GetObjectCommand).rejects(
        new S3ServiceException({
          name: 'InternalError',
          $fault: 'server',
          $metadata: { httpStatusCode: 500 },
        })
      );

      await expect(objectsStorage.get('assessment-id')).rejects.toThrow(Error);
    });
  });

  describe('list', () => {
    it('should return an empty list when no objects are found', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(ListObjectsV2Command).resolves({
        Contents: [],
        $metadata: { httpStatusCode: 200 },
      });
      await expect(objectsStorage.list('prefix')).resolves.toEqual([]);

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
      await expect(objectsStorage.list('prefix')).resolves.toEqual([
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

      await expect(objectsStorage.list('prefix')).rejects.toThrow(Error);
    });
  });

  describe('bulkDelete', () => {
    it('should delete a list of objects', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(DeleteObjectsCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      await objectsStorage.bulkDelete(['key1', 'key2']);

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

      await expect(objectsStorage.bulkDelete(['key1', 'key2'])).rejects.toThrow(
        Error
      );
    });

    it('should not call client send if keys array is empty', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      await objectsStorage.bulkDelete([]);

      const bulkDeleteExecutionCalls =
        s3ClientMock.commandCalls(DeleteObjectsCommand);
      expect(bulkDeleteExecutionCalls).toHaveLength(0);
    });
  });

  describe('put', () => {
    it('should put an object with a string', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      const objectContent = 'object-content';
      s3ClientMock.on(GetObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
        Body: stringToStream(objectContent) as any,
      });

      s3ClientMock.on(DeleteObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      s3ClientMock.on(PutObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      await objectsStorage.put({
        key: 'assessment-id',
        body: objectContent,
      });

      const putExecutionCalls = s3ClientMock.commandCalls(PutObjectCommand);
      expect(putExecutionCalls).toHaveLength(1);
      const putExecutionCall = putExecutionCalls[0];
      expect(putExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Key: 'assessment-id',
        Body: objectContent,
      });
    });

    it('should put an object with a Buffer', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      const objectContent = 'object-content';
      s3ClientMock.on(GetObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
        Body: stringToStream(objectContent) as any,
      });

      s3ClientMock.on(DeleteObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      s3ClientMock.on(PutObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      await objectsStorage.put({
        key: 'assessment-id',
        body: Buffer.from(objectContent),
      });

      const putExecutionCalls = s3ClientMock.commandCalls(PutObjectCommand);
      expect(putExecutionCalls).toHaveLength(1);
      const putExecutionCall = putExecutionCalls[0];
      expect(putExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Key: 'assessment-id',
        Body: Buffer.from(objectContent),
      });
    });

    it('should return the S3 URI of the object', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();
      s3ClientMock.on(PutObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      const uri = await objectsStorage.put({
        key: 'assessment-id',
        body: 'object-content',
      });
      expect(uri).toBe(`s3://${bucket}/assessment-id`);
    });

    it('should throw an exception if put object fail', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(PutObjectCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        objectsStorage.put({ key: 'assessment-id', body: 'object-content' })
      ).rejects.toThrow(Error);
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

  describe('delete', () => {
    it('should delete an object', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(DeleteObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      await objectsStorage.delete(
        ObjectsStorageS3.getAssessmentsPath('assessment-id')
      );

      const deleteExecutionCalls =
        s3ClientMock.commandCalls(DeleteObjectCommand);
      expect(deleteExecutionCalls).toHaveLength(1);
      const deleteExecutionCall = deleteExecutionCalls[0];
      expect(deleteExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Key: ObjectsStorageS3.getAssessmentsPath('assessment-id'),
      });
    });

    it('should succeed if object does not exist', async () => {
      const { objectsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(DeleteObjectCommand).resolves({
        $metadata: { httpStatusCode: 204 },
      });
      await objectsStorage.delete(
        ObjectsStorageS3.getAssessmentsPath('assessment-id')
      );

      const deleteExecutionCalls =
        s3ClientMock.commandCalls(DeleteObjectCommand);
      expect(deleteExecutionCalls).toHaveLength(1);
      const deleteExecutionCall = deleteExecutionCalls[0];
      expect(deleteExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Key: ObjectsStorageS3.getAssessmentsPath('assessment-id'),
      });
    });

    it('should throw an error when object fails to delete', async () => {
      const { objectsStorage, s3ClientMock } = setup();

      s3ClientMock.on(DeleteObjectCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(objectsStorage.delete('assessment-id')).rejects.toThrow(
        Error
      );
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
