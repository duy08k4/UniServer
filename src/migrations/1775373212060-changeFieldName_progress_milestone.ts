import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFieldNameProgressMilestone1775373212060 implements MigrationInterface {
    name = 'ChangeFieldNameProgressMilestone1775373212060'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "progresses" RENAME COLUMN "required_approval" TO "created_approval"`);
        await queryRunner.query(`ALTER TABLE "milestones" ALTER COLUMN "updated_at" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestones" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "progresses" RENAME COLUMN "created_approval" TO "required_approval"`);
    }

}
