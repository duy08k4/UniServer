import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutlineWaitingUniAdmin1778600000000 implements MigrationInterface {
    name = 'AddOutlineWaitingUniAdmin1778600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."topics_status_enum" ADD VALUE IF NOT EXISTS 'outline_waiting_uniadmin'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQl does not support removing values from an enum type easily.
        // Usually, we would need to recreate the type. 
        // For simplicity in this dev environment, we leave it as is or do nothing.
    }
}
