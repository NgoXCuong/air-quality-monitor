import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherModule } from '../weather/weather.module';
import { AirQualityModule } from '../air-quality/air-quality.module';
import { ForecastModule } from '../forecast/forecast.module';
import { SchedulerService } from './scheduler.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        WeatherModule,
        AirQualityModule,
        ForecastModule,
    ],
    providers: [SchedulerService],
    exports: [SchedulerService],
})
export class SchedulerModule {}
