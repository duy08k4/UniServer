import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubmitFlagProgress1775490019891 implements MigrationInterface {
    name = 'AddSubmitFlagProgress1775490019891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "progresses" ADD "is_submitted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "progresses" DROP COLUMN "is_submitted"`);
    }

}
