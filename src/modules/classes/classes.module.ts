import { Module } from "@nestjs/common";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";

// Entities
import { Users } from "src/entities/user.en";
import { UseCasePermission } from "src/entities/use_case_permissions.en";
import { Classes } from "src/entities/classes.en";
import { ClassGateway } from "../websocket/class.gateway";
import { ClassMembers } from "src/entities/class_members.en";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Users, UseCasePermission, Classes, ClassMembers])],
    controllers: [ClassesController],
    providers: [ClassesService, ClassGateway],
    exports: []
})
export class ClassesModule {}