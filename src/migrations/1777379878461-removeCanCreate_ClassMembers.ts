import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCanCreateClassMembers1777379878461 implements MigrationInterface {
    name = 'RemoveCanCreateClassMembers1777379878461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" DROP COLUMN IF EXISTS "can_create_notifications"`)
        await queryRunner.query(`ALTER TABLE "class_members" DROP COLUMN IF EXISTS "can_create_forms"`)
        await queryRunner.query(`ALTER TABLE "class_members" DROP COLUMN IF EXISTS "can_create_score_forms"`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" ADD COLUMN "can_create_notifications" boolean NOT NULL DEFAULT false`)
        await queryRunner.query(`ALTER TABLE "class_members" ADD COLUMN "can_create_forms" boolean NOT NULL DEFAULT false`)
        await queryRunner.query(`ALTER TABLE "class_members" ADD COLUMN "can_create_score_forms" boolean NOT NULL DEFAULT false`)
    }
}
