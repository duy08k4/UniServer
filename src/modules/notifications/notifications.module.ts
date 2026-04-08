import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([])],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [],
})
export class NotificationsModule { }