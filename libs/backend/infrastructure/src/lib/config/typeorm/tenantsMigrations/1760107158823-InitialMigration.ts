import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class InitialMigration1758792504371 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organizations" ("domain" character varying NOT NULL, "name" character varying NOT NULL, "accountId" character varying, "assessmentExportRoleArn" character varying, "unitBasedAgreementId" character varying, "freeAssessmentsLeft" integer, CONSTRAINT "PK_98678ed828cc71e4f8a58c95d6b" PRIMARY KEY ("domain"));
      
      CREATE TABLE "aceIntegrations" ("domain" character varying NOT NULL, "roleArn" character varying NOT NULL, "solutions" character varying array NOT NULL DEFAULT '{}', CONSTRAINT "PK_749fb2cf262a235b6b5ad698abc" PRIMARY KEY ("domain"));
      
      CREATE TABLE "opportunityTeamMembers" ("domain" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, CONSTRAINT "PK_43fe4542e03681d516829f7eedb" PRIMARY KEY ("domain"));
      
      CREATE TABLE "tenants" ("id" character varying NOT NULL, "databaseName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9fafdb68183e5c48e11d90358bb" UNIQUE ("databaseName"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"));
      
      ALTER TABLE "aceIntegrations" ADD CONSTRAINT "FK_749fb2cf262a235b6b5ad698abc" FOREIGN KEY ("domain") REFERENCES "organizations"("domain") ON DELETE CASCADE ON UPDATE NO ACTION;
      
      ALTER TABLE "opportunityTeamMembers" ADD CONSTRAINT "FK_43fe4542e03681d516829f7eedb" FOREIGN KEY ("domain") REFERENCES "aceIntegrations"("domain") ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "opportunityTeamMembers" DROP CONSTRAINT "FK_43fe4542e03681d516829f7eedb";
      ALTER TABLE "aceIntegrations" DROP CONSTRAINT "FK_749fb2cf262a235b6b5ad698abc";
      
      DROP TABLE "opportunityTeamMembers";
      DROP TABLE "aceIntegrations";
      DROP TABLE "organizations";
      DROP TABLE "tenants";
    `);
  }
}
