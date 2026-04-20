import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

// Config
import databaseConfig from "./config/data-source"
import supabaseConfig from "./config/supabase"

// Modules
import { AuthModule } from "./modules/auth/auth.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ProgressModule } from "./modules/progress/progress.module";
import { FormsModule } from "./modules/forms/forms.module";
import { ScoreForms } from "./entities/score_forms.en";
import { ScoreFormsModule } from "./modules/scoreforms/scoreforms.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, supabaseConfig],
      envFilePath: '.env'
    }),

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
    AdminModule, AuthModule, ClassesModule, ProgressModule, FormsModule, ScoreForms, ScoreFormsModule
  ],
  controllers: [],
  providers: []
})
export class AppModule { }
