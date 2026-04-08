import { MigrationInterface, QueryRunner } from "typeorm";

export class ExcludeMilestonesProgresses1775547044603 implements MigrationInterface {
    name = 'ExcludeMilestonesProgresses1775547044603'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestones" ALTER COLUMN "description" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestones" ALTER COLUMN "description" SET DEFAULT true`);
    }

}
