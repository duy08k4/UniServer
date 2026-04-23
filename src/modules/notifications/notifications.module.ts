import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Notifications } from "src/entities/notifications.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Forms } from "src/entities/forms.en";
import { MailService } from "./mail.service";
import { NotificationGateway } from "./notifications.gateway";

@Module({
    imports: [ConfigModule, AuthModule, TypeOrmModule.forFeature([Notifications, ClassMembers, Forms])],
    controllers: [NotificationsController],
    providers: [NotificationsService, MailService, NotificationGateway],
    exports: [],
})
export class NotificationsModule { }
