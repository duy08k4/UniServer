import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { Topics } from "src/entities/topics.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Milestones } from "src/entities/milestones.en";
import { Users } from "src/entities/user.en";
import { TopicsController } from "./topics.controller";
import { TopicsService } from "./topics.service";

@Module({
    imports: [ConfigModule, AuthModule, TypeOrmModule.forFeature([Topics, ClassMembers, Milestones, Users])],
    controllers: [TopicsController],
    providers: [TopicsService],
    exports: [TypeOrmModule],
})
export class TopicsModule { }
