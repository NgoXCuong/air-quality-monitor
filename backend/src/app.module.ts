import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { WeatherModule } from './modules/weather/weather.module';
import { AirQualityModule } from './modules/air-quality/air-quality.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { UsersModule } from './modules/users/users.module';
import { LocationsModule } from './modules/locations/locations.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    name: 'default',
                    ttl: 60000,  // 60 giây
                    limit: 60,   // 60 requests / phút (mặc định cho tất cả routes)
                },
            ],
        }),
        PrismaModule,
        AuthModule,
        WeatherModule,
        AirQualityModule,
        SchedulerModule,
        UsersModule,
        LocationsModule,
    ],
    providers: [
        // Global rate limiting guard
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        // Global JWT guard – all routes protected by default, use @Public() to bypass
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        // Global role guard
        { provide: APP_GUARD, useClass: RolesGuard },
        // Global response interceptor – wraps all responses in { success, message, data }
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
})
export class AppModule {}