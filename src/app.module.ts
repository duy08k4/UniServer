import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

// Config
import databaseConfig from "./config/data-source"
import supabaseConfig from "./config/supabase"

// Modules
import { AuthModule } from "./modules/auth/auth.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { ProgressModule } from "./modules/progress/progress.module";
import { FormsModule } from "./modules/forms/forms.module";
import { ScoreFormsModule } from "./modules/scoreforms/scoreforms.module";
import { TopicsModule } from "./modules/topics/topics.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";
import { CommitteesModule } from "./modules/committees/committees.module";
import { ScheduleModule } from "@nestjs/schedule";
import { TasksModule } from "./modules/tasks/tasks.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, supabaseConfig],
      envFilePath: '.env'
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get("database")
        return {
          ...dbConfig
        }
      },
      inject: [ConfigService]
    }),
    TypeOrmModule.forFeature([]),
    AuthModule, ClassesModule, NotificationsModule, ProgressModule, TopicsModule, FormsModule, ScoreFormsModule, SubmissionsModule, CommitteesModule, TasksModule
  ],
  controllers: [],
  providers: []
})
export class AppModule { }
