import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1758120351308 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assessments" (
        "id" uuid NOT NULL,
        "createdBy" character varying NOT NULL,
        "executionArn" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "name" character varying NOT NULL,
        "questionVersion" character varying,
        "regions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "exportRegion" character varying,
        "roleArn" character varying NOT NULL,
        "finished" boolean NOT NULL DEFAULT false,
        "workflows" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "error" jsonb,
        CONSTRAINT "PK_a3442bd80a00e9111cefca57f6c" PRIMARY KEY ("id")
      );

      CREATE TABLE "fileExports" (
        "assessmentId" uuid NOT NULL,
        "id" character varying NOT NULL,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL,
        "error" character varying,
        "versionName" character varying NOT NULL,
        "objectKey" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_3f9c0c057719b8facca374bbf0a" PRIMARY KEY ("assessmentId", "id")
      );

      CREATE TABLE "pillars" (
        "assessmentId" uuid NOT NULL,
        "id" character varying NOT NULL,
        "disabled" boolean NOT NULL,
        "label" character varying NOT NULL,
        "primaryId" character varying NOT NULL,
        CONSTRAINT "PK_802c42f29f1ed0dfe066379c706" PRIMARY KEY ("assessmentId", "id")
      );

      CREATE TABLE "questions" (
        "assessmentId" uuid NOT NULL,
        "pillarId" character varying NOT NULL,
        "id" character varying NOT NULL,
        "disabled" boolean NOT NULL,
        "label" character varying NOT NULL,
        "none" boolean NOT NULL,
        "primaryId" character varying NOT NULL,
        CONSTRAINT "PK_276f759cbfed687ee1d3620e18e" PRIMARY KEY ("assessmentId", "pillarId", "id")
      );

      CREATE TABLE "bestPractices" (
        "assessmentId" uuid NOT NULL,
        "questionId" character varying NOT NULL,
        "pillarId" character varying NOT NULL,
        "id" character varying NOT NULL,
        "description" character varying NOT NULL,
        "label" character varying NOT NULL,
        "primaryId" character varying NOT NULL,
        "risk" character varying NOT NULL,
        "checked" boolean NOT NULL,
        CONSTRAINT "PK_e73637d262c033b70565fe16fa1" PRIMARY KEY ("assessmentId", "questionId", "pillarId", "id")
      );

      CREATE TABLE "findings" (
        "assessmentId" uuid NOT NULL,
        "id" character varying NOT NULL,
        "hidden" boolean NOT NULL,
        "isAIAssociated" boolean NOT NULL,
        "eventCode" character varying,
        "riskDetails" character varying NOT NULL,
        "severity" character varying NOT NULL,
        "statusCode" character varying NOT NULL,
        "statusDetail" character varying NOT NULL,
        CONSTRAINT "PK_b39edcda0d7788c79c294bd1486" PRIMARY KEY ("assessmentId", "id")
      );

      CREATE TABLE "findingRemediations" (
        "assessmentId" uuid NOT NULL,
        "findingId" character varying NOT NULL,
        "desc" character varying NOT NULL,
        "references" jsonb NOT NULL DEFAULT '[]'::jsonb,
        CONSTRAINT "PK_f136adbe3c219f1f84fad65f4cf" PRIMARY KEY ("assessmentId", "findingId")
      );

      CREATE TABLE "findingResources" (
        "assessmentId" uuid NOT NULL,
        "findingId" character varying NOT NULL,
        "name" character varying,
        "region" character varying NOT NULL,
        "type" character varying,
        "uid" character varying,
        CONSTRAINT "PK_9db9bd70df700a57a89d46bf1fb" PRIMARY KEY ("assessmentId", "findingId")
      );

      CREATE TABLE "findingComments" (
        "id" character varying NOT NULL,
        "assessmentId" uuid NOT NULL,
        "findingId" character varying NOT NULL,
        "authorId" character varying NOT NULL,
        "text" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_8f92d7814751dec9518b1bda589" PRIMARY KEY ("id")
      );

      CREATE TABLE "findingBestPractices" (
        "bp_assessment_id" uuid NOT NULL,
        "bp_question_id" character varying NOT NULL,
        "bp_pillar_id" character varying NOT NULL,
        "bp_id" character varying NOT NULL,
        "finding_assessment_id" uuid NOT NULL,
        "finding_id" character varying NOT NULL,
        CONSTRAINT "PK_6988cf8c1d7481fdb4d0bcead57" PRIMARY KEY (
          "bp_assessment_id",
          "bp_question_id",
          "bp_pillar_id",
          "bp_id",
          "finding_assessment_id",
          "finding_id"
        )
      );

      ALTER TABLE "fileExports"
        ADD CONSTRAINT "FK_65284f7dd9c54762749573337c4" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE;

      ALTER TABLE "pillars"
        ADD CONSTRAINT "FK_b3bc8d4c88901dc8c5d3ba0470d" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE;

      ALTER TABLE "questions"
        ADD CONSTRAINT "FK_b3f26af2c5816468ada9a1b8557" FOREIGN KEY ("pillarId", "assessmentId") REFERENCES "pillars"("id", "assessmentId") ON DELETE CASCADE;

      ALTER TABLE "bestPractices"
        ADD CONSTRAINT "FK_9210513eccd68552745e2246837" FOREIGN KEY ("questionId", "pillarId", "assessmentId") REFERENCES "questions"("id", "pillarId", "assessmentId") ON DELETE CASCADE;

      ALTER TABLE "findings"
        ADD CONSTRAINT "FK_73ce25cc3dab8b7756b690fe46e" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE;

      ALTER TABLE "findingRemediations"
        ADD CONSTRAINT "FK_711dcc73a323e7c35e80aeaa3a5" FOREIGN KEY ("findingId", "assessmentId") REFERENCES "findings"("id", "assessmentId") ON DELETE CASCADE;

      ALTER TABLE "findingResources"
        ADD CONSTRAINT "FK_7b724a8fd242d4f70fd63aeb8d7" FOREIGN KEY ("findingId", "assessmentId") REFERENCES "findings"("id", "assessmentId") ON DELETE CASCADE;

      ALTER TABLE "findingComments"
        ADD CONSTRAINT "FK_1f9bc05746d55795105db974260" FOREIGN KEY ("findingId", "assessmentId") REFERENCES "findings"("id", "assessmentId") ON DELETE CASCADE;

      ALTER TABLE "findingBestPractices"
        ADD CONSTRAINT "FK_bcfe77cf5d5a8e2e9f381d2a253" FOREIGN KEY ("bp_assessment_id", "bp_question_id", "bp_pillar_id", "bp_id") REFERENCES "bestPractices"("assessmentId", "questionId", "pillarId", "id") ON DELETE CASCADE;

      ALTER TABLE "findingBestPractices"
        ADD CONSTRAINT "FK_5fd7ae299b6a4b67d3c5491207a" FOREIGN KEY ("finding_assessment_id", "finding_id") REFERENCES "findings"("assessmentId", "id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "findingBestPractices";
      DROP TABLE IF EXISTS "findingComments";
      DROP TABLE IF EXISTS "findingResources";
      DROP TABLE IF EXISTS "findingRemediations";
      DROP TABLE IF EXISTS "findings";
      DROP TABLE IF EXISTS "bestPractices";
      DROP TABLE IF EXISTS "questions";
      DROP TABLE IF EXISTS "pillars";
      DROP TABLE IF EXISTS "fileExports";
      DROP TABLE IF EXISTS "assessments";
    `);
  }
}
