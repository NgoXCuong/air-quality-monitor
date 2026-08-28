import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from '../weather/weather.service';
import { AirQualityService } from '../air-quality/air-quality.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private readonly weatherService: WeatherService,
        private readonly airQualityService: AirQualityService,
    ) {}

    /**
     * Cron Job định kỳ 30 phút / lần: Tự động quét và đồng bộ Thời tiết & AQI cho toàn bộ địa điểm
     */
    @Cron(CronExpression.EVERY_30_MINUTES)
    async handleCronSyncData() {
        this.logger.log('⏰ Starting Scheduled Weather & AQI Synchronization...');

        try {
            const weatherRes = await this.weatherService.syncWeather();
            this.logger.log(`  ├─ Weather Sync: ${weatherRes.message}`);

            const aqiRes = await this.airQualityService.syncAirQuality();
            this.logger.log(`  └─ AQI Sync: ${aqiRes.message}`);

            this.logger.log('✅ Scheduled Synchronization completed successfully.');
        } catch (error) {
            this.logger.error(`❌ Scheduled Synchronization failed: ${error?.message}`);
        }
    }

    /**
     * Thủ công kích hoạt đồng bộ
     */
    async triggerSyncAll() {
        await this.handleCronSyncData();
        return { message: 'Đã kích hoạt đồng bộ dữ liệu thời tiết & AQI định kỳ thủ công thành công.' };
    }
}
