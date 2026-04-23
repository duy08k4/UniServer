import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCascadeMilestonesProgress1776800000001 implements MigrationInterface {
    name = 'FixCascadeMilestonesProgress1776800000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestones" DROP CONSTRAINT IF EXISTS "FK_a34419a251bc6cbed29ae1a89ed"`);
        await queryRunner.query(`ALTER TABLE "milestones" ADD CONSTRAINT "FK_a34419a251bc6cbed29ae1a89ed" FOREIGN KEY ("progress") REFERENCES "progresses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestones" DROP CONSTRAINT "FK_a34419a251bc6cbed29ae1a89ed"`);
        await queryRunner.query(`ALTER TABLE "milestones" ADD CONSTRAINT "FK_a34419a251bc6cbed29ae1a89ed" FOREIGN KEY ("progress") REFERENCES "progresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
