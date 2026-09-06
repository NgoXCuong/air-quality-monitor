import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherModule } from '../weather/weather.module';
import { AirQualityModule } from '../air-quality/air-quality.module';
import { ForecastModule } from '../forecast/forecast.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SchedulerService } from './scheduler.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        WeatherModule,
        AirQualityModule,
        ForecastModule,
        NotificationsModule,
        PrismaModule,
    ],
    providers: [SchedulerService],
    exports: [SchedulerService],
})
export class SchedulerModule {}
