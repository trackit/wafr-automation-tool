import { MigrationInterface, QueryRunner } from 'typeorm';

export class OpportunityTeamMembersFix1763639123682
  implements MigrationInterface
{
  name = 'OpportunityTeamMembersFix1763639123682';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opportunityTeamMembers" DROP CONSTRAINT "PK_43fe4542e03681d516829f7eedb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opportunityTeamMembers" ADD CONSTRAINT "PK_5adbe8edada31b5f0bf7488e34d" PRIMARY KEY ("domain", "email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opportunityTeamMembers" DROP CONSTRAINT "PK_5adbe8edada31b5f0bf7488e34d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opportunityTeamMembers" ADD CONSTRAINT "PK_43fe4542e03681d516829f7eedb" PRIMARY KEY ("domain")`,
    );
  }
}
