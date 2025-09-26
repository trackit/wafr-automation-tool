import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1758792504371 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" varchar PRIMARY KEY,
        "databaseName" varchar UNIQUE NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "organizations" (
        "domain" varchar PRIMARY KEY,
        "accountId" varchar,
        "assessmentExportRoleArn" varchar,
        "unitBasedAgreementId" varchar,
        "freeAssessmentsLeft" integer
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "organizations";
      DROP TABLE "tenants";
    `);
  }
}
