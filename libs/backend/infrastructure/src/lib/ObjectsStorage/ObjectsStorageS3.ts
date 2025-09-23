import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ObjectsStorage } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined, type Readable, streamToString } from '@shared/utils';

import { tokenLogger } from '../Logger';

export class ObjectsStorageS3 implements ObjectsStorage {
  private readonly client = inject(tokenClientS3);
  private readonly logger = inject(tokenLogger);
  private readonly bucket = inject(tokenS3Bucket);

  static getAssessmentsPath(assessmentId: string): string {
    return `assessments/${assessmentId}`;
  }

  private buildURI(key: string): string {
    return `s3://${this.bucket}/${key}`;
  }

  public async get(key: string): Promise<string | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const response = await this.client.send(command);
      return response.Body ? streamToString(response.Body as Readable) : null;
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.warn(`Object not found on S3 (key="${key}")`);
        return null;
      }
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    if (
      response.$metadata.httpStatusCode !== 200 &&
      response.$metadata.httpStatusCode !== 204
    ) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(`Object deleted: ${key}`);
  }

  public async list(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(`Listing objects: ${prefix}`);
    return response.Contents?.map((content) => content.Key as string) ?? [];
  }

  public async bulkDelete(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(`Deleted objects: ${keys}`);
  }

  public async put(args: {
    key: string;
    body: string | Buffer;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: args.key,
      Body: args.body,
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(`Object succesfuly added: ${args.key}`);
    return this.buildURI(args.key);
  }

  public parseURI(uri: string): { bucket: string; key: string } {
    const { hostname: bucket, pathname } = new URL(uri);
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    return { bucket, key };
  }

  public async generatePresignedURL(args: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: args.key,
    });
    try {
      const url = await getSignedUrl(this.client, command, {
        expiresIn: args.expiresInSeconds,
      });
      this.logger.info(`Presigned URL generated: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error}`, args);
      throw error;
    }
  }
}

export const tokenObjectsStorage = createInjectionToken<ObjectsStorage>(
  'ObjectsStorage',
  {
    useClass: ObjectsStorageS3,
  }
);

export const tokenClientS3 = createInjectionToken<S3Client>('ClientS3', {
  useClass: S3Client,
});

export const tokenS3Bucket = createInjectionToken<string>('S3Bucket', {
  useFactory: () => {
    const bucket = process.env.S3_BUCKET;
    assertIsDefined(bucket, 'S3_BUCKET is not defined');
    return bucket;
  },
});
