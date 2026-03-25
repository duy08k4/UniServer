import { Module } from "@nestjs/common";

// Controller
import { AuthController } from "./auth.controller";

// Serivce
import { AuthService } from "./auth.service";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entities
import { Users } from "src/entities/user.en";
import { UseCasePermission } from "src/entities/use_case_permissions.en";

@Module({
    imports: [TypeOrmModule.forFeature([Users, UseCasePermission])],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService]
})
export class AuthModule {}