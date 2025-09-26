import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1758120351308 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assessments" ("id" uuid NOT NULL, "createdBy" character varying NOT NULL, "executionArn" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "graphData" jsonb, "name" character varying NOT NULL, "questionVersion" character varying, "rawGraphData" jsonb NOT NULL DEFAULT '{}', "regions" text NOT NULL DEFAULT '', "exportRegion" character varying, "roleArn" character varying NOT NULL, "finished" boolean NOT NULL DEFAULT false, "workflows" text NOT NULL DEFAULT '', "error" jsonb, CONSTRAINT "PK_a3442bd80a00e9111cefca57f6c" PRIMARY KEY ("id"));

      CREATE TABLE "pillars" ("assessmentId" uuid NOT NULL, "id" character varying NOT NULL, "disabled" boolean NOT NULL, "label" character varying NOT NULL, "primaryId" character varying NOT NULL, CONSTRAINT "PK_802c42f29f1ed0dfe066379c706" PRIMARY KEY ("assessmentId", "id"));

      CREATE TABLE "questions" ("assessmentId" uuid NOT NULL, "pillarId" character varying NOT NULL, "id" character varying NOT NULL, "disabled" boolean NOT NULL, "label" character varying NOT NULL, "none" boolean NOT NULL, "primaryId" character varying NOT NULL, CONSTRAINT "PK_276f759cbfed687ee1d3620e18e" PRIMARY KEY ("assessmentId", "pillarId", "id"));

      CREATE TABLE "bestPractices" ("assessmentId" uuid NOT NULL, "questionId" character varying NOT NULL, "pillarId" character varying NOT NULL, "id" character varying NOT NULL, "description" character varying NOT NULL, "label" character varying NOT NULL, "primaryId" character varying NOT NULL, "results" text NOT NULL DEFAULT '', "risk" character varying NOT NULL, "checked" boolean NOT NULL, CONSTRAINT "PK_e73637d262c033b70565fe16fa1" PRIMARY KEY ("assessmentId", "questionId", "pillarId", "id"));

      CREATE TABLE "findings" ("assessmentId" uuid NOT NULL, "id" character varying NOT NULL, "bestPractices" character varying NOT NULL, "hidden" boolean NOT NULL, "isAIAssociated" boolean NOT NULL, "metadata" jsonb, "remediation" jsonb, "resources" jsonb, "riskDetails" text, "severity" character varying, "statusCode" character varying, "statusDetail" text, CONSTRAINT "PK_b39edcda0d7788c79c294bd1486" PRIMARY KEY ("assessmentId", "id"));

      CREATE INDEX "IDX_8d7190e021ea32b776756cdb24" ON "findings" ("bestPractices");

      CREATE TABLE "findingComments" ("id" character varying NOT NULL, "assessmentId" uuid NOT NULL, "findingId" character varying NOT NULL, "authorId" character varying NOT NULL, "text" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_8f92d7814751dec9518b1bda589" PRIMARY KEY ("id"));

      ALTER TABLE "pillars" ADD CONSTRAINT "FK_b3bc8d4c88901dc8c5d3ba0470d" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    
      ALTER TABLE "questions" ADD CONSTRAINT "FK_b3f26af2c5816468ada9a1b8557" FOREIGN KEY ("pillarId", "assessmentId") REFERENCES "pillars"("id","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION;
    
      ALTER TABLE "bestPractices" ADD CONSTRAINT "FK_9210513eccd68552745e2246837" FOREIGN KEY ("questionId", "pillarId", "assessmentId") REFERENCES "questions"("id","pillarId","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION;

      ALTER TABLE "findingComments" ADD CONSTRAINT "FK_1f9bc05746d55795105db974260" FOREIGN KEY ("findingId", "assessmentId") REFERENCES "findings"("id","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "findingComments";
      DROP TABLE IF EXISTS "findings";
      DROP INDEX IF EXISTS "IDX_8d7190e021ea32b776756cdb24";
      DROP TABLE IF EXISTS "bestPractices";
      DROP TABLE IF EXISTS "questions";
      DROP TABLE IF EXISTS "pillars";
      DROP TABLE IF EXISTS "assessments";
    `);
  }
}
