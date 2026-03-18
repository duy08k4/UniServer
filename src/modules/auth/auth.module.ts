import { Module } from "@nestjs/common";

// Controller
import { AuthController } from "./auth.controller";

// Serivce
import { AuthService } from "./auth.service";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entities
import { Users } from "src/entities/user.en";

@Module({
    imports: [TypeOrmModule.forFeature([Users])],
    controllers: [AuthController],
    providers: [AuthService],
    exports: []
})
export class AuthModule {}