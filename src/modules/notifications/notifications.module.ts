import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Notifications } from "src/entities/notifications.en";
import { ClassMembers } from "src/entities/class_members.en";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Notifications, ClassMembers])],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [],
})
export class NotificationsModule { }