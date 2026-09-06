import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from '../weather/weather.service';
import { AirQualityService } from '../air-quality/air-quality.service';
import { ForecastService } from '../forecast/forecast.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private readonly weatherService: WeatherService,
        private readonly airQualityService: AirQualityService,
        private readonly forecastService: ForecastService,
        private readonly notificationsService: NotificationsService,
        private readonly prisma: PrismaService,
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

            // Tự động quét và kích hoạt cảnh báo ô nhiễm vượt ngưỡng
            const latestAirQualityList = await this.prisma.airQualityData.findMany({
                distinct: ['locationId'],
                orderBy: { timestamp: 'desc' },
                include: { location: true },
            });

            for (const item of latestAirQualityList) {
                if (item.aqi >= 150 && item.location) {
                    await this.notificationsService.checkAndDispatchAqiAlerts(
                        item.locationId,
                        item.aqi,
                        item.pm25 || 50,
                        item.location.name,
                    );
                }
            }

            this.logger.log('✅ Scheduled Synchronization completed successfully.');
        } catch (error) {
            this.logger.error(`❌ Scheduled Synchronization failed: ${error?.message}`);
        }
    }

    /**
     * Cron Job định kỳ 3 giờ / lần: Tự động chạy dự báo chuỗi thời gian 24h AI cho tất cả các địa điểm
     */
    @Cron(CronExpression.EVERY_3_HOURS)
    async handleCronForecastSync() {
        this.logger.log('🤖 Starting Scheduled 24h AI Forecast Generation...');

        try {
            const res = await this.forecastService.generateForecastForAll(false);
            this.logger.log(`  └─ 24h AI Forecast Sync: ${res.message}`);
        } catch (error) {
            this.logger.error(`❌ Scheduled Forecast Generation failed: ${error?.message}`);
        }
    }

    /**
     * Thủ công kích hoạt đồng bộ
     */
    async triggerSyncAll() {
        await this.handleCronSyncData();
        await this.handleCronForecastSync();
        return { message: 'Đã kích hoạt đồng bộ dữ liệu thời tiết, AQI & dự báo AI 24h định kỳ thủ công thành công.' };
    }
}
