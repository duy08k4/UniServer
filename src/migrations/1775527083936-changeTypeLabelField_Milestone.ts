import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTypeLabelFieldMilestone1775527083936 implements MigrationInterface {
    name = 'ChangeTypeLabelFieldMilestone1775527083936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3981c3d8ecb4c98fd1feff697f"`);
        await queryRunner.query(`ALTER TABLE "milestones" ALTER COLUMN "label" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_3981c3d8ecb4c98fd1feff697f" ON "milestones" ("progress", "label", "created_by", "is_deleted", "is_stopped") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3981c3d8ecb4c98fd1feff697f"`);
        await queryRunner.query(`ALTER TABLE "milestones" ALTER COLUMN "label" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_3981c3d8ecb4c98fd1feff697f" ON "milestones" ("created_by", "is_deleted", "is_stopped", "label", "progress") `);
    }

}
