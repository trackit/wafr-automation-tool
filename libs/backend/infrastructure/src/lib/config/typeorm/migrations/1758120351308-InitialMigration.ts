import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1758120351308 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assessments" (
        "id" uuid PRIMARY KEY,
        "createdBy" varchar NOT NULL,
        "executionArn" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL,
        "graphData" jsonb,
        "name" varchar NOT NULL,
        "questionVersion" varchar,
        "rawGraphData" jsonb NOT NULL DEFAULT '{}',
        "regions" varchar[] NOT NULL DEFAULT ARRAY[]::varchar[],
        "exportRegion" varchar,
        "roleArn" varchar NOT NULL,
        "finished" boolean NOT NULL DEFAULT false,
        "workflows" varchar[] NOT NULL DEFAULT ARRAY[]::varchar[],
        "error" jsonb
      );

      CREATE TABLE "pillars" (
        "assessmentId" uuid NOT NULL,
        "id" varchar NOT NULL,
        "disabled" boolean NOT NULL,
        "label" varchar NOT NULL,
        "primaryId" varchar NOT NULL,
        PRIMARY KEY ("assessmentId", "id"),
        CONSTRAINT "FK_pillars_assessment" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE
      );

      CREATE TABLE "questions" (
        "assessmentId" uuid NOT NULL,
        "pillarId" varchar NOT NULL,
        "id" varchar NOT NULL,
        "disabled" boolean NOT NULL,
        "label" varchar NOT NULL,
        "none" boolean NOT NULL,
        "primaryId" varchar NOT NULL,
        PRIMARY KEY ("assessmentId", "pillarId", "id"),
        CONSTRAINT "FK_questions_pillar" FOREIGN KEY ("pillarId", "assessmentId") REFERENCES "pillars"("id", "assessmentId") ON DELETE CASCADE
      );

      CREATE TABLE "bestPractices" (
        "assessmentId" uuid NOT NULL,
        "questionId" varchar NOT NULL,
        "pillarId" varchar NOT NULL,
        "id" varchar NOT NULL,
        "description" varchar NOT NULL,
        "label" varchar NOT NULL,
        "primaryId" varchar NOT NULL,
        "results" varchar[] NOT NULL DEFAULT ARRAY[]::varchar[],
        "risk" varchar NOT NULL,
        "checked" boolean NOT NULL,
        PRIMARY KEY ("assessmentId", "questionId", "pillarId", "id"),
        CONSTRAINT "FK_bestPractices_question" FOREIGN KEY ("questionId", "pillarId", "assessmentId") REFERENCES "questions"("id", "pillarId", "assessmentId") ON DELETE CASCADE
      );

      CREATE TABLE "findings" (
        "assessmentId" uuid NOT NULL,
        "id" varchar NOT NULL,
        "bestPractices" varchar NOT NULL,
        "hidden" boolean NOT NULL,
        "isAIAssociated" boolean NOT NULL,
        "metadata" jsonb,
        "remediation" jsonb,
        "resources" jsonb,
        "riskDetails" text,
        "severity" varchar,
        "statusCode" varchar,
        "statusDetail" text,
        PRIMARY KEY ("assessmentId", "id")
      );

      CREATE TABLE "findingComments" (
        "id" varchar PRIMARY KEY,
        "assessmentId" uuid NOT NULL,
        "findingId" varchar NOT NULL,
        "authorId" varchar NOT NULL,
        "text" text NOT NULL,
        "createdAt" timestamptz NOT NULL,
        CONSTRAINT "FK_findingComments_finding" FOREIGN KEY ("findingId", "assessmentId") REFERENCES "findings"("id", "assessmentId") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "findingComments";
      DROP TABLE IF EXISTS "findings";
      DROP TABLE IF EXISTS "bestPractices";
      DROP TABLE IF EXISTS "questions";
      DROP TABLE IF EXISTS "pillars";
      DROP TABLE IF EXISTS "assessments";
    `);
  }
}
