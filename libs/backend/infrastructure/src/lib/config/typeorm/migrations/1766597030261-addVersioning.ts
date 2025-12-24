import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * ⚠️ DESTRUCTIVE MIGRATION
 *
 * This migration introduces assessment versioning and changes
 * primary/foreign keys across multiple tables.
 *
 * Rolling back this migration after data has been written
 * using versions > 1 will cause irreversible data loss.
 *
 * This migration must NOT be rolled back in production.
 * Rollback requires restoring a database backup.
 */

export class AddVersioning1766597030261 implements MigrationInterface {
  name = 'AddVersioning1766597030261';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "assessmentVersions" ("assessmentId" uuid NOT NULL, "version" integer NOT NULL, "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "executionArn" character varying, "finishedAt" TIMESTAMP WITH TIME ZONE, "error" jsonb, "wafrWorkloadArn" character varying, "exportRegion" character varying, CONSTRAINT "PK_d7342a522572a22321134612be5" PRIMARY KEY ("assessmentId", "version"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pillars" DROP CONSTRAINT "FK_b3bc8d4c88901dc8c5d3ba0470d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_b3f26af2c5816468ada9a1b8557"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bestPractices" DROP CONSTRAINT "FK_9210513eccd68552745e2246837"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingRemediations" DROP CONSTRAINT "FK_f09f37bc852d3d6adb9cc412ad4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingResources" DROP CONSTRAINT "FK_bf9eb6f809025adb98f07df7227"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingComments" DROP CONSTRAINT "FK_1f9bc05746d55795105db974260"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" DROP CONSTRAINT "FK_b1535dec73c0c697e52c0f1fc07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" DROP CONSTRAINT "FK_a3cb2221c3aab83c80e818d9407"`,
    );
    await queryRunner.query(`DROP INDEX "public"."ix_findingResources_fk"`);
    await queryRunner.query(`DROP INDEX "public"."ix_findingComments_fk"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b1535dec73c0c697e52c0f1fc0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3cb2221c3aab83c80e818d940"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "latestVersionNumber" integer`,
    );
    await queryRunner.query(`ALTER TABLE "pillars" ADD "version" integer`);
    await queryRunner.query(`ALTER TABLE "questions" ADD "version" integer`);
    await queryRunner.query(
      `ALTER TABLE "bestPractices" ADD "version" integer`,
    );
    await queryRunner.query(`ALTER TABLE "findings" ADD "version" integer`);
    await queryRunner.query(
      `ALTER TABLE "findingRemediations" ADD "version" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingResources" ADD "version" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingComments" ADD "version" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ADD "findingVersion" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ADD "bestPracticeVersion" integer`,
    );

    // Set default values for existing data: all existant assessments get version 1
    await queryRunner.query(
      `UPDATE "assessments" SET "latestVersionNumber" = 1 WHERE "latestVersionNumber" IS NULL`,
    );

    // Create assessmentVersions entries for all existing assessments (version 1)
    await queryRunner.query(
      `INSERT INTO "assessmentVersions" ("assessmentId", "version", "createdBy", "createdAt", "executionArn", "finishedAt", "error", "wafrWorkloadArn", "exportRegion")
       SELECT "id", 1, "createdBy", "createdAt", "executionArn", "finishedAt", "error", "wafrWorkloadArn", "exportRegion"
       FROM "assessments"`,
    );

    // Set version = 1 for all existing data
    await queryRunner.query(
      `UPDATE "pillars" SET "version" = 1 WHERE "version" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "questions" SET "version" = 1 WHERE "version" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "bestPractices" SET "version" = 1 WHERE "version" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "findings" SET "version" = 1 WHERE "version" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "findingRemediations" SET "version" = 1 WHERE "version" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "findingResources" SET "version" = 1 WHERE "version" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "findingBestPractices" SET "findingVersion"= 1 WHERE "findingVersion" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "findingBestPractices" SET "bestPracticeVersion"= 1 WHERE "bestPracticeVersion" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ALTER COLUMN "latestVersionNumber" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pillars" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pillars" DROP CONSTRAINT "PK_802c42f29f1ed0dfe066379c706"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pillars" ADD CONSTRAINT "PK_04a239e073bcf62fb53bc2eae92" PRIMARY KEY ("assessmentId", "id", "version")`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "PK_276f759cbfed687ee1d3620e18e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "PK_faee782d2827d84ddb974147662" PRIMARY KEY ("assessmentId", "pillarId", "id", "version")`,
    );
    await queryRunner.query(
      `ALTER TABLE "bestPractices" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "bestPractices" DROP CONSTRAINT "PK_e73637d262c033b70565fe16fa1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bestPractices" ADD CONSTRAINT "PK_1fa4013f9085632a034c99ea8c7" PRIMARY KEY ("assessmentId", "questionId", "pillarId", "id", "version")`,
    );
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "findings" DROP CONSTRAINT "PK_b39edcda0d7788c79c294bd1486"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findings" ADD CONSTRAINT "PK_4105b27f9269bd08af00b01791f" PRIMARY KEY ("assessmentId", "id", "version")`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingRemediations" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingRemediations" DROP CONSTRAINT "PK_f09f37bc852d3d6adb9cc412ad4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingRemediations" ADD CONSTRAINT "PK_cf6e913d5691864710ef8c67832" PRIMARY KEY ("assessmentId", "findingId", "version")`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingResources" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingResources" DROP CONSTRAINT "PK_4123540a6fa7a271c64156be7c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingResources" ADD CONSTRAINT "PK_0fa519b0afa7d4b980a0f26f3a4" PRIMARY KEY ("id", "version")`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingComments" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingComments" DROP CONSTRAINT "PK_8f92d7814751dec9518b1bda589"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingComments" ADD CONSTRAINT "PK_17c2ed5f67e4988a299cde25413" PRIMARY KEY ("id", "version")`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ALTER COLUMN "findingVersion" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ALTER COLUMN "bestPracticeVersion" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" DROP CONSTRAINT "PK_5bfac9d42de24ef3e11ff26cb13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ADD CONSTRAINT "PK_1ca46edca01c292d3090ffabb2b" PRIMARY KEY ("findingAssessmentId", "findingId", "bestPracticeAssessmentId", "questionId", "pillarId", "bestPracticeId", "findingVersion", "bestPracticeVersion")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_findingResources_fk" ON "findingResources" ("assessmentId", "findingId", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_findingComments_fk" ON "findingComments" ("assessmentId", "findingId", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_79e37267c60e475463d39ff9fe" ON "findingBestPractices" ("findingAssessmentId", "findingVersion", "findingId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_415395b8c50d4a5921cd4ab89c" ON "findingBestPractices" ("bestPracticeAssessmentId", "bestPracticeVersion", "questionId", "pillarId", "bestPracticeId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "assessmentVersions" ADD CONSTRAINT "FK_6ba774d1b51968cc071682b63a6" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pillars" ADD CONSTRAINT "FK_fcf80de27cb42cc8a0663ab1cd6" FOREIGN KEY ("assessmentId", "version") REFERENCES "assessmentVersions"("assessmentId","version") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_bf268935b78e9e168ac9994ba10" FOREIGN KEY ("pillarId", "version", "assessmentId") REFERENCES "pillars"("id","version","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bestPractices" ADD CONSTRAINT "FK_7df158757d69e22b3e5f0c31745" FOREIGN KEY ("questionId", "pillarId", "version", "assessmentId") REFERENCES "questions"("id","pillarId","version","assessmentId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingRemediations" ADD CONSTRAINT "FK_cf6e913d5691864710ef8c67832" FOREIGN KEY ("findingId", "assessmentId", "version") REFERENCES "findings"("id","assessmentId","version") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingResources" ADD CONSTRAINT "FK_37089242ceeae060810e94f8f70" FOREIGN KEY ("findingId", "assessmentId", "version") REFERENCES "findings"("id","assessmentId","version") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingComments" ADD CONSTRAINT "FK_c380d97f3fdd75c356cc53fdb53" FOREIGN KEY ("findingId", "assessmentId", "version") REFERENCES "findings"("id","assessmentId","version") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ADD CONSTRAINT "FK_79e37267c60e475463d39ff9fe9" FOREIGN KEY ("findingAssessmentId", "findingVersion", "findingId") REFERENCES "findings"("assessmentId","version","id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "findingBestPractices" ADD CONSTRAINT "FK_415395b8c50d4a5921cd4ab89cb" FOREIGN KEY ("bestPracticeAssessmentId", "bestPracticeVersion", "questionId", "pillarId", "bestPracticeId") REFERENCES "bestPractices"("assessmentId","version","questionId","pillarId","id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'This migration is destructive and cannot be safely rolled back. ',
    );
  }
}
