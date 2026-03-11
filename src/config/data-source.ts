import { registerAs } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import * as dotenv from 'dotenv'

dotenv.config()

export default registerAs('database', (): TypeOrmModuleOptions => {
    return {
        type: 'postgres',
        // Sử dụng URL duy nhất từ Environment Variable
        url: process.env.DATABASE_URL,

        // Bắt buộc phải có SSL để Render "nói chuyện" được với Supabase qua Internet
        ssl: { rejectUnauthorized: false },

        // Các thông số extra tối quan trọng cho Transaction Pooler (6543)
        extra: {
            max: 10, // Không để quá cao, tránh làm tràn pool của Supabase
            connectionTimeoutMillis: 10000, // Sau 10s không kết nối được thì báo lỗi ngay (để Render retry)
            idleTimeoutMillis: 120000, // Giải phóng kết nối rác sau 2 phút
            statement_timeout: 10000, // Ngắt các query bị treo quá 10s
        },

        synchronize: false,
        logging: true, // true nếu cần debug sâu
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.ts,.js}'],
        autoLoadEntities: true,
    };
})