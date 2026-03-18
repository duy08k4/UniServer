import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

// Config
import databaseConfig from "./config/data-source"
import supabaseConfig from "./config/supabase"
import { AuthModule } from "./modules/auth/auth.module";

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
    AuthModule
  ],
  controllers: [],
  providers: []
})
export class AppModule { }
