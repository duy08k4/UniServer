import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateColumnClassMembers1774852812843 implements MigrationInterface {
    name = 'UpdateColumnClassMembers1774852812843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" DROP COLUMN "is_deleted"`);
    }

}
