import { MigrationInterface, QueryRunner } from "typeorm";

export class SetRelationNotificationMilestones1775970962501 implements MigrationInterface {
    name = 'SetRelationNotificationMilestones1775970962501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "milestone" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_c832e65200c7ae7567832b05472" FOREIGN KEY ("milestone") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_c832e65200c7ae7567832b05472"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "milestone"`);
    }

}
