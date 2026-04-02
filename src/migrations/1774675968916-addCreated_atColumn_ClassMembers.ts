import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtColumnClassMembers1774675968916 implements MigrationInterface {
    name = 'AddCreatedAtColumnClassMembers1774675968916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" DROP COLUMN "created_at"`);
    }

}
