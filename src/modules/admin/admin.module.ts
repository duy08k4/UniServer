import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Controler
import { AdminController } from "./admin.controller";

// Service
import { AdminService } from "./admin.service";

// Module
import { AuthModule } from "../auth/auth.module";

// Entities
import { Users } from "src/entities/user.en";
import { UseCases } from "src/entities/use_cases.en";
import { UseCasePermission } from "src/entities/use_case_permissions.en";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Users, UseCases, UseCasePermission])],
    controllers: [AdminController],
    providers: [AdminService],
    exports: []
})
export class AdminModule {}