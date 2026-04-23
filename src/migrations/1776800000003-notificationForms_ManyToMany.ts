import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationFormsManyToMany1776800000003 implements MigrationInterface {
    name = 'NotificationFormsManyToMany1776800000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forms" DROP COLUMN IF EXISTS "notification"`);
        await queryRunner.query(`
            CREATE TABLE "notification_forms" (
                "notification_id" uuid NOT NULL,
                "form_id" uuid NOT NULL,
                CONSTRAINT "PK_notification_forms" PRIMARY KEY ("notification_id", "form_id"),
                CONSTRAINT "FK_notification_forms_notification" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_notification_forms_form" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notification_forms"`);
        await queryRunner.query(`ALTER TABLE "forms" ADD COLUMN "notification" uuid`);
        await queryRunner.query(`ALTER TABLE "forms" ADD CONSTRAINT "FK_forms_notification" FOREIGN KEY ("notification") REFERENCES "notifications"("id") ON DELETE CASCADE`);
    }
}
