import { Module } from "@nestjs/common";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";

// Entities
import { Users } from "src/entities/user.en";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Users])],
    controllers: [ClassesController],
    providers: [ClassesService],
    exports: []
})
export class ClassesModule {}