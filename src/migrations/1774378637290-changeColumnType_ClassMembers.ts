import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeColumnTypeClassMembers1774378637290 implements MigrationInterface {
    name = 'ChangeColumnTypeClassMembers1774378637290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" ALTER COLUMN "joined_at" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" ALTER COLUMN "joined_at" DROP DEFAULT`);
    }

}
