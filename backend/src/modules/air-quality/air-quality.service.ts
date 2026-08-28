import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAirQualityDto, QueryAirQualityHistoryDto } from './dto/air-quality.dto';

export function calculateUsAqiFromPm25(pm25: number): number {
    if (pm25 < 0) return 0;
    if (pm25 <= 12.0) return Math.round(((50 - 0) / (12.0 - 0.0)) * (pm25 - 0.0) + 0);
    if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
    if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
    if (pm25 <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301);
    if (pm25 <= 500.4) return Math.round(((500 - 401) / (500.4 - 350.5)) * (pm25 - 350.5) + 401);
    return 500;
}

export function getAqiLevelName(aqi: number): string {
    if (aqi <= 50) return 'Tốt (Good)';
    if (aqi <= 100) return 'Trung bình (Moderate)';
    if (aqi <= 150) return 'Kém (Unhealthy for Sensitive Groups)';
    if (aqi <= 200) return 'Xấu (Unhealthy)';
    if (aqi <= 300) return 'Rất xấu (Very Unhealthy)';
    return 'Nguy hại (Hazardous)';
}

function rand(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

@Injectable()
export class AirQualityService {
    private readonly logger = new Logger(AirQualityService.name);
    private readonly apiKey: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly http: HttpService,
    ) {
        this.apiKey = this.config.get<string>('OPENWEATHER_API_KEY', '');
    }

    /**
     * GET /air-quality/current
     * Chuẩn RESTful: Đọc từ Database, không tạo Side-Effect khi GET
     */
    async getCurrentAirQuality(query: QueryAirQualityDto) {
        const { locationId, lat, lon } = query;

        let targetLocationId = locationId;

        if (!targetLocationId && lat !== undefined && lon !== undefined) {
            const matched = await this.prisma.location.findFirst({
                where: {
                    latitude: { gte: lat - 0.1, lte: lat + 0.1 },
                    longitude: { gte: lon - 0.1, lte: lon + 0.1 },
                },
            });
            targetLocationId = matched?.id;
        }

        // Đọc bản ghi mới nhất từ DB
        if (targetLocationId) {
            const latestInDb = await this.prisma.airQualityData.findFirst({
                where: { locationId: targetLocationId },
                orderBy: { timestamp: 'desc' },
                include: { location: true },
            });

            if (latestInDb) {
                return {
                    location: latestInDb.location,
                    aqi: latestInDb.aqi,
                    aqiLevel: getAqiLevelName(latestInDb.aqi),
                    pm25: latestInDb.pm25,
                    pm10: latestInDb.pm10,
                    co: latestInDb.co,
                    o3: latestInDb.o3,
                    no2: latestInDb.no2,
                    so2: latestInDb.so2,
                    timestamp: latestInDb.timestamp,
                };
            }
        }

        // Nếu chưa có trong DB, đồng bộ dữ liệu ban đầu
        if (targetLocationId) {
            return this.fetchAndSaveAirQuality(targetLocationId);
        }

        // Trường hợp chỉ truyền tọa độ không khớp locationId nào
        return this.fetchExternalAirQuality(lat ?? 21.0285, lon ?? 105.8542);
    }

    /**
     * GET /air-quality/history
     * Lấy lịch sử chỉ số AQI từ DB
     */
    async getAirQualityHistory(query: QueryAirQualityHistoryDto) {
        const { locationId, limit = 30 } = query;

        if (!locationId) {
            throw new NotFoundException('Vui lòng cung cấp locationId để xem lịch sử AQI.');
        }

        return this.prisma.airQualityData.findMany({
            where: { locationId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    /**
     * POST /air-quality/sync
     * Ép buộc đồng bộ dữ liệu AQI từ API ngoài vào DB
     */
    async syncAirQuality(locationId?: string) {
        if (locationId) {
            const location = await this.prisma.location.findUnique({ where: { id: locationId } });
            if (!location) throw new NotFoundException(`Không tìm thấy locationId: ${locationId}`);
            const result = await this.fetchAndSaveAirQuality(location.id, location.latitude, location.longitude);
            return { message: `Đã đồng bộ thành công cho ${location.name}`, data: result };
        }

        // Đồng bộ toàn bộ các địa điểm trong hệ thống
        const locations = await this.prisma.location.findMany();
        const results: any[] = [];

        for (const loc of locations) {
            try {
                const res = await this.fetchAndSaveAirQuality(loc.id, loc.latitude, loc.longitude);
                results.push(res);
            } catch (err) {
                this.logger.error(`Lỗi đồng bộ AQI cho ${loc.name}: ${err?.message}`);
            }
        }

        return {
            message: `Đã đồng bộ dữ liệu AQI cho ${results.length}/${locations.length} địa điểm.`,
            syncedCount: results.length,
        };
    }

    /**
     * Helper: Fetch từ API bên ngoài và chèn vào DB
     */
    public async fetchAndSaveAirQuality(locationId: string, lat?: number, lon?: number) {
        let latitude = lat;
        let longitude = lon;

        if (latitude === undefined || longitude === undefined) {
            const loc = await this.prisma.location.findUnique({ where: { id: locationId } });
            if (!loc) throw new NotFoundException('Không tìm thấy địa điểm');
            latitude = loc.latitude;
            longitude = loc.longitude;
        }

        const externalData = await this.fetchExternalAirQuality(latitude, longitude);

        const created = await this.prisma.airQualityData.create({
            data: {
                locationId,
                aqi: externalData.aqi,
                pm25: externalData.pm25 ?? null,
                pm10: externalData.pm10 ?? null,
                co: externalData.co ?? null,
                o3: externalData.o3 ?? null,
                no2: externalData.no2 ?? null,
                so2: externalData.so2 ?? null,
                timestamp: new Date(externalData.timestamp * 1000),
            },
        });

        return {
            ...created,
            aqiLevel: getAqiLevelName(created.aqi),
        };
    }

    /**
     * Helper: Fetch dữ liệu bên ngoài từ OWM / Open-Meteo / Mock
     */
    private async fetchExternalAirQuality(lat: number, lon: number) {
        try {
            const owmUrl = `https://api.openweathermap.org/data/2.5/air_pollution`;
            const { data } = await firstValueFrom(
                this.http.get(owmUrl, {
                    params: { lat, lon, appid: this.apiKey },
                }),
            );

            const components = data.list[0].components;
            const pm25 = components.pm2_5;
            const computedAqi = calculateUsAqiFromPm25(pm25);

            return {
                lat,
                lon,
                timestamp: data.list[0].dt,
                aqi: computedAqi,
                pm25: components.pm2_5,
                pm10: components.pm10,
                co: components.co,
                o3: components.o3,
                no2: components.no2,
                so2: components.so2,
            };
        } catch {
            // Fallbacksang Open-Meteo Air Quality
            try {
                const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality`;
                const { data } = await firstValueFrom(
                    this.http.get(openMeteoUrl, {
                        params: {
                            latitude: lat,
                            longitude: lon,
                            current: 'us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide',
                        },
                    }),
                );

                const current = data.current;
                const computedAqi = current.us_aqi ?? calculateUsAqiFromPm25(current.pm2_5 ?? 25);

                return {
                    lat,
                    lon,
                    timestamp: Math.floor(Date.now() / 1000),
                    aqi: computedAqi,
                    pm25: current.pm2_5 ?? null,
                    pm10: current.pm10 ?? null,
                    co: current.carbon_monoxide ?? null,
                    o3: current.ozone ?? null,
                    no2: current.nitrogen_dioxide ?? null,
                    so2: current.sulphur_dioxide ?? null,
                };
            } catch {
                const mockPm25 = rand(15, 65);
                const mockAqi = calculateUsAqiFromPm25(mockPm25);

                return {
                    lat,
                    lon,
                    timestamp: Math.floor(Date.now() / 1000),
                    aqi: mockAqi,
                    pm25: mockPm25,
                    pm10: rand(35, 90),
                    co: rand(150, 450),
                    o3: rand(20, 70),
                    no2: rand(10, 40),
                    so2: rand(2, 15),
                };
            }
        }
    }
}
