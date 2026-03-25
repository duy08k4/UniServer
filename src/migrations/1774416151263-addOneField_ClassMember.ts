import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOneFieldClassMember1774416151263 implements MigrationInterface {
    name = 'AddOneFieldClassMember1774416151263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" ADD "roomadmin_approved" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" DROP COLUMN "roomadmin_approved"`);
    }

}
