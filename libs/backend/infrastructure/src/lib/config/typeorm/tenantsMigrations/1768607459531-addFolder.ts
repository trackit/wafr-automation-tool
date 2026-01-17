import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFolder1768607459531 implements MigrationInterface {
    name = 'AddFolder1768607459531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" ADD "folders" character varying array DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "folders"`);
    }

}
