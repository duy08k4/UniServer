import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBanFieldProgress1775393800365 implements MigrationInterface {
    name = 'AddBanFieldProgress1775393800365'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "progresses" ADD "is_banned" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "progresses" DROP COLUMN "is_banned"`);
    }

}
