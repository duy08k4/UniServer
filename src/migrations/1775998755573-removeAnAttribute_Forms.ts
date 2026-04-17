import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAnAttributeForms1775998755573 implements MigrationInterface {
    name = 'RemoveAnAttributeForms1775998755573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forms" DROP COLUMN "email_notification_enabled"`);
        await queryRunner.query(`ALTER TABLE "forms" ALTER COLUMN "update_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "forms" ALTER COLUMN "created_at" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forms" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "forms" ALTER COLUMN "update_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "forms" ADD "email_notification_enabled" boolean NOT NULL DEFAULT true`);
    }

}
