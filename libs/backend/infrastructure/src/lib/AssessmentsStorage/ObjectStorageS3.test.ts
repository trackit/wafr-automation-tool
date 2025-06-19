import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { inject, reset } from '@shared/di-container';
import { mockClient } from 'aws-sdk-client-mock';
import { format } from 'util';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  ASSESSMENTS_PATH,
  AssessmentsStorageS3,
  tokenClientS3,
  tokenS3Bucket,
} from './ObjectStorageS3';

describe('AssessmentStorage Infrastructure', () => {
  describe('delete', () => {
    it('should delete an object', async () => {
      const { assessmentsStorage, s3ClientMock, bucket } = setup();

      s3ClientMock.on(DeleteObjectCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      await assessmentsStorage.delete('assessment-id');

      const deleteExecutionCalls =
        s3ClientMock.commandCalls(DeleteObjectCommand);
      expect(deleteExecutionCalls).toHaveLength(1);
      const deleteExecutionCall = deleteExecutionCalls[0];
      expect(deleteExecutionCall.args[0].input).toEqual({
        Bucket: bucket,
        Key: format(ASSESSMENTS_PATH, 'assessment-id'),
      });
    });

    it('should throw an error when object fails to delete', async () => {
      const { assessmentsStorage, s3ClientMock } = setup();

      s3ClientMock.on(DeleteObjectCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(assessmentsStorage.delete('assessment-id')).rejects.toThrow(
        Error
      );
    });
  });

  describe('put', () => {
    it('should put an object', async () => {});

    it('should throw an exception if put object fail', async () => {});
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const assessmentsStorage = new AssessmentsStorageS3();
  const s3ClientMock = mockClient(inject(tokenClientS3));
  return {
    assessmentsStorage,
    bucket: inject(tokenS3Bucket),
    s3ClientMock,
  };
};
