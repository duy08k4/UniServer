import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveEnableEmailNotifications1776685994368 implements MigrationInterface {
    name = 'RemoveEnableEmailNotifications1776685994368'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "email_notification_enabled"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "email_notification_enabled" boolean NOT NULL DEFAULT false`);
    }

}
