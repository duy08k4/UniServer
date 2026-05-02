import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entity
import { Users } from "@app/entities/user.en";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { GlobalGateway } from "../socket/socketGlobal.gateway";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Users])],
    controllers: [AdminController],
    providers: [AdminService, GlobalGateway],
    exports: [],
})
export class AdminModule {}