import { MigrationInterface, QueryRunner } from "typeorm";

export class InstallUnaccent1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Lệnh này kích hoạt hàm unaccent trong PostgreSQL
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Lệnh này gỡ bỏ khi cần rollback
        await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent`);
    }
}