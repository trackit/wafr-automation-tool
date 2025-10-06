import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1759772737583 implements MigrationInterface {
  name = 'InitialMigration1759772737583';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "assessments" ("id" uuid NOT NULL, "createdBy" character varying NOT NULL, "executionArn" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "questionVersion" character varying, "regions" jsonb NOT NULL DEFAULT '[]', "exportRegion" character varying, "roleArn" character varying NOT NULL, "finished" boolean NOT NULL DEFAULT false, "workflows" jsonb NOT NULL DEFAULT '[]', "error" jsonb, CONSTRAINT "uq_assessments_uuid" UNIQUE ("id"), CONSTRAINT "PK_a3442bd80a00e9111cefca57f6c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_assessments_uuid" ON "assessments" ("id") `
    );
    await queryRunner.query(
      `CREATE TABLE "pillars" ("assessmentId" uuid NOT NULL, "id" character varying NOT NULL, "disabled" boolean NOT NULL DEFAULT false, "label" character varying NOT NULL, "primaryId" character varying NOT NULL, CONSTRAINT "uq_pillars_assessment" UNIQUE ("assessmentId", "id"), CONSTRAINT "PK_802c42f29f1ed0dfe066379c706" PRIMARY KEY ("assessmentId", "id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_pillars_assessment" ON "pillars" ("assessmentId", "id") `
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("assessmentId" uuid NOT NULL, "pillarId" character varying NOT NULL, "id" character varying NOT NULL, "disabled" boolean NOT NULL DEFAULT false, "label" character varying NOT NULL, "none" boolean NOT NULL DEFAULT false, "primaryId" character varying NOT NULL, CONSTRAINT "uq_questions_assessment" UNIQUE ("assessmentId", "pillarId", "id"), CONSTRAINT "PK_276f759cbfed687ee1d3620e18e" PRIMARY KEY ("assessmentId", "pillarId", "id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_questions_pillar" ON "questions" ("assessmentId", "pillarId", "id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bestPractices_risk_enum" AS ENUM('Unknown', 'Informational', 'Low', 'Medium', 'High', 'Critical', 'Fatal', 'Other')`
    );
    await queryRunner.query(
      `CREATE TABLE "bestPractices" ("assessmentId" uuid NOT NULL, "questionId" character varying NOT NULL, "pillarId" character varying NOT NULL, "id" character varying NOT NULL, "description" text NOT NULL, "label" character varying NOT NULL, "primaryId" character varying NOT NULL, "risk" "public"."bestPractices_risk_enum" NOT NULL, "checked" boolean NOT NULL DEFAULT false, CONSTRAINT "uq_bp_assessment" UNIQUE ("assessmentId", "questionId", "pillarId", "id"), CONSTRAINT "PK_e73637d262c033b70565fe16fa1" PRIMARY KEY ("assessmentId", "questionId", "pillarId", "id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_bp_question" ON "bestPractices" ("assessmentId", "questionId", "pillarId", "id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fileExports_type_enum" AS ENUM('pdf')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fileExports_status_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ERRORED')`
    );
    await queryRunner.query(
      `CREATE TABLE "fileExports" ("assessmentId" uuid NOT NULL, "id" character varying NOT NULL, "type" "public"."fileExports_type_enum" NOT NULL, "status" "public"."fileExports_status_enum" NOT NULL, "error" character varying, "versionName" character varying NOT NULL, "objectKey" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_fileExports_assessment" UNIQUE ("assessmentId", "id"), CONSTRAINT "PK_2f2c52bf5ed48a2aefec24fde4a" PRIMARY KEY ("assessmentId", "id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_fileExports_assessment" ON "fileExports" ("assessmentId", "id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."findings_severity_enum" AS ENUM('Unknown', 'Informational', 'Low', 'Medium', 'High', 'Critical', 'Fatal', 'Other')`
    );
    await queryRunner.query(
      `CREATE TABLE "findings" ("assessmentId" uuid NOT NULL, "id" character varying NOT NULL, "hidden" boolean NOT NULL, "isAIAssociated" boolean NOT NULL, "eventCode" character varying, "riskDetails" text NOT NULL, "severity" "public"."findings_severity_enum" NOT NULL, "statusCode" character varying NOT NULL, "statusDetail" text NOT NULL, CONSTRAINT "uq_findings_pk" UNIQUE ("assessmentId", "id"), CONSTRAINT "PK_b39edcda0d7788c79c294bd1486" PRIMARY KEY ("assessmentId", "id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_findings_assessment_id" ON "findings" ("assessmentId", "id") `
    );
    await queryRunner.query(
      `CREATE TABLE "findingRemediations" ("assessmentId" uuid NOT NULL, "findingId" character varying NOT NULL, "desc" text NOT NULL, "references" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "uq_findingRemediations_pk" UNIQUE ("assessmentId", "findingId"), CONSTRAINT "PK_f09f37bc852d3d6adb9cc412ad4" PRIMARY KEY ("assessmentId", "findingId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_findingRemediations_fk" ON "findingRemediations" ("assessmentId", "findingId") `
    );
    await queryRunner.query(
      `CREATE TABLE "findingResources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assessmentId" uuid NOT NULL, "findingId" character varying NOT NULL, "name" character varying, "region" character varying, "type" character varying, "uid" character varying, CONSTRAINT "uq_findingResources_pk" UNIQUE ("id"), CONSTRAINT "PK_4123540a6fa7a271c64156be7c3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_findingResources_fk" ON "findingResources" ("assessmentId", "findingId") `
    );
    await queryRunner.query(
      `CREATE TABLE "findingComments" ("id" uuid NOT NULL, "assessmentId" uuid NOT NULL, "findingId" character varying NOT NULL, "authorId" character varying NOT NULL, "text" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "uq_findingComments_pk" UNIQUE ("id"), CONSTRAINT "PK_8f92d7814751dec9518b1bda589" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ix_findingComments_fk" ON "findingComments" ("assessmentId", "findingId") `
    );
    await queryRunner.query(
      `CREATE TABLE "findingBestPractices" ("finding_assessment_id" uuid NOT NULL, "finding_id" character varying NOT NULL, "bp_assessment_id" uuid NOT NULL, "bp_question_id" character varying NOT NULL, "bp_pillar_id" character varying NOT NULL, "bp_id" character varying NOT NULL, CONSTRAINT "PK_98c9eb276a7035da8efff372f80" PRIMARY KEY ("finding_assessment_id", "finding_id", "bp_assessment_id", "bp_question_id", "bp_pillar_id", "bp_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80f11db6a0316dcd0d88f56a97" ON "findingBestPractices" ("finding_assessment_id", "finding_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6b5e0b659d288b22fa96a631f" ON "findingBestPractices" ("bp_assessment_id", "bp_question_id", "bp_pillar_id", "bp_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "pillars" ADD CONSTRAINT "FK_b3bc8d4c88901dc8c5d3ba0470d" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_b3f26af2c5816468ada9a1b8557" FOREIGN KEY ("pillarId", "assessmentId") REFERENCES "pillars"("id","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "bestPractices" ADD CONSTRAINT "FK_9210513eccd68552745e2246837" FOREIGN KEY ("questionId", "pillarId", "assessmentId") REFERENCES "questions"("id","pillarId","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "fileExports" ADD CONSTRAINT "FK_d013b320f5f12cc9dba8cf9e471" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "findingRemediations" ADD CONSTRAINT "FK_f09f37bc852d3d6adb9cc412ad4" FOREIGN KEY ("findingId", "assessmentId") REFERENCES "findings"("id","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "findingResources" ADD CONSTRAINT "FK_bf9eb6f809025adb98f07df7227" FOREIGN KEY ("findingId", "assessmentId") REFERENCES "findings"("id","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "findingComments" ADD CONSTRAINT "FK_1f9bc05746d55795105db974260" FOREIGN KEY ("findingId", "assessmentId") REFERENCES "findings"("id","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ADD CONSTRAINT "FK_80f11db6a0316dcd0d88f56a972" FOREIGN KEY ("finding_assessment_id", "finding_id") REFERENCES "findings"("assessmentId","id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ADD CONSTRAINT "FK_d6b5e0b659d288b22fa96a631fb" FOREIGN KEY ("bp_assessment_id", "bp_question_id", "bp_pillar_id", "bp_id") REFERENCES "bestPractices"("assessmentId","questionId","pillarId","id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" DROP CONSTRAINT "FK_d6b5e0b659d288b22fa96a631fb"`
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" DROP CONSTRAINT "FK_80f11db6a0316dcd0d88f56a972"`
    );
    await queryRunner.query(
      `ALTER TABLE "findingComments" DROP CONSTRAINT "FK_1f9bc05746d55795105db974260"`
    );
    await queryRunner.query(
      `ALTER TABLE "findingResources" DROP CONSTRAINT "FK_bf9eb6f809025adb98f07df7227"`
    );
    await queryRunner.query(
      `ALTER TABLE "findingRemediations" DROP CONSTRAINT "FK_f09f37bc852d3d6adb9cc412ad4"`
    );
    await queryRunner.query(
      `ALTER TABLE "fileExports" DROP CONSTRAINT "FK_d013b320f5f12cc9dba8cf9e471"`
    );
    await queryRunner.query(
      `ALTER TABLE "bestPractices" DROP CONSTRAINT "FK_9210513eccd68552745e2246837"`
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_b3f26af2c5816468ada9a1b8557"`
    );
    await queryRunner.query(
      `ALTER TABLE "pillars" DROP CONSTRAINT "FK_b3bc8d4c88901dc8c5d3ba0470d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6b5e0b659d288b22fa96a631f"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80f11db6a0316dcd0d88f56a97"`
    );
    await queryRunner.query(`DROP TABLE "findingBestPractices"`);
    await queryRunner.query(`DROP INDEX "public"."ix_findingComments_fk"`);
    await queryRunner.query(`DROP TABLE "findingComments"`);
    await queryRunner.query(`DROP INDEX "public"."ix_findingResources_fk"`);
    await queryRunner.query(`DROP TABLE "findingResources"`);
    await queryRunner.query(`DROP INDEX "public"."ix_findingRemediations_fk"`);
    await queryRunner.query(`DROP TABLE "findingRemediations"`);
    await queryRunner.query(`DROP INDEX "public"."ix_findings_assessment_id"`);
    await queryRunner.query(`DROP TABLE "findings"`);
    await queryRunner.query(`DROP TYPE "public"."findings_severity_enum"`);
    await queryRunner.query(`DROP INDEX "public"."ix_fileExports_assessment"`);
    await queryRunner.query(`DROP TABLE "fileExports"`);
    await queryRunner.query(`DROP TYPE "public"."fileExports_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."fileExports_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."ix_bp_question"`);
    await queryRunner.query(`DROP TABLE "bestPractices"`);
    await queryRunner.query(`DROP TYPE "public"."bestPractices_risk_enum"`);
    await queryRunner.query(`DROP INDEX "public"."ix_questions_pillar"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP INDEX "public"."ix_pillars_assessment"`);
    await queryRunner.query(`DROP TABLE "pillars"`);
    await queryRunner.query(`DROP INDEX "public"."ix_assessments_uuid"`);
    await queryRunner.query(`DROP TABLE "assessments"`);
  }
}
