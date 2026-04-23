import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationBodyToText1776800000002 implements MigrationInterface {
    name = 'NotificationBodyToText1776800000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "body" TYPE text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "body" TYPE character varying`);
    }
}
