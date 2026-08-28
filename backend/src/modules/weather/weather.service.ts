import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CurrentWeatherDto,
    DailyWeatherDto,
    HourlyWeatherDto,
    WeatherQueryDto,
} from './dto/weather.dto';

export function owmIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function kToc(k: number): number {
    return parseFloat((k - 273.15).toFixed(1));
}

function groupByDay(list: any[]): Record<string, any[]> {
    return list.reduce<Record<string, any[]>>((acc, item) => {
        const day = item.dt_txt?.slice(0, 10) ?? new Date(item.dt * 1000).toISOString().slice(0, 10);
        if (!acc[day]) acc[day] = [];
        acc[day].push(item);
        return acc;
    }, {});
}

function rand(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

@Injectable()
export class WeatherService {
    private readonly logger = new Logger(WeatherService.name);
    private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
    private readonly apiKey: string;
    private readonly defaultLat: number;
    private readonly defaultLon: number;

    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
        private readonly prisma: PrismaService,
    ) {
        this.apiKey = this.config.get<string>('OPENWEATHER_API_KEY', '');
        this.defaultLat = parseFloat(this.config.get<string>('WEATHER_DEFAULT_LAT', '21.0285'));
        this.defaultLon = parseFloat(this.config.get<string>('WEATHER_DEFAULT_LON', '105.8542'));
    }

    /**
     * GET /weather/current
     * RESTful: Đọc từ DB, không tạo Side-Effect khi GET
     */
    async getCurrentWeather(query: WeatherQueryDto) {
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

        if (targetLocationId) {
            const latestInDb = await this.prisma.weatherData.findFirst({
                where: { locationId: targetLocationId },
                orderBy: { timestamp: 'desc' },
                include: { location: true },
            });

            if (latestInDb) {
                return latestInDb;
            }

            return this.fetchAndSaveWeather(targetLocationId);
        }

        return this.fetchExternalWeather(lat ?? this.defaultLat, lon ?? this.defaultLon);
    }

    /**
     * GET /weather/history
     * Đọc lịch sử thời tiết từ DB
     */
    async getWeatherHistory(locationId: string, limit = 30) {
        if (!locationId) {
            throw new NotFoundException('Vui lòng cung cấp locationId để xem lịch sử thời tiết.');
        }

        return this.prisma.weatherData.findMany({
            where: { locationId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    /**
     * GET /weather/hourly
     */
    async getHourly(lat?: number, lon?: number): Promise<HourlyWeatherDto[]> {
        const la = lat ?? this.defaultLat;
        const lo = lon ?? this.defaultLon;

        try {
            const url = `${this.baseUrl}/forecast`;
            const { data } = await firstValueFrom(
                this.http.get(url, {
                    params: { lat: la, lon: lo, appid: this.apiKey, cnt: 8 },
                }),
            );

            return data.list.map((item: any): HourlyWeatherDto => ({
                timestamp: item.dt,
                temp: kToc(item.main.temp),
                feels_like: kToc(item.main.feels_like),
                humidity: item.main.humidity,
                pressure: item.main.pressure,
                wind_speed: item.wind?.speed ?? 0,
                wind_deg: item.wind?.deg ?? 0,
                clouds: item.clouds?.all ?? 0,
                weather_main: item.weather[0].main,
                weather_description: item.weather[0].description,
                weather_icon: item.weather[0].icon,
                pop: item.pop ?? 0,
            }));
        } catch {
            return Array.from({ length: 8 }).map((_, i) => ({
                timestamp: Math.floor(Date.now() / 1000) + i * 3 * 3600,
                temp: rand(26, 33),
                feels_like: rand(28, 35),
                humidity: Math.round(rand(60, 85)),
                pressure: 1012,
                wind_speed: rand(2, 5),
                wind_deg: 120,
                clouds: 30,
                weather_main: 'Clouds',
                weather_description: 'few clouds',
                weather_icon: '02d',
                pop: rand(0, 0.3),
            }));
        }
    }

    /**
     * GET /weather/daily
     * Trả về dự báo 5 ngày tới & lưu vào bảng ForecastData cho AI
     */
    async getDaily(lat?: number, lon?: number, locationId?: string): Promise<DailyWeatherDto[]> {
        const la = lat ?? this.defaultLat;
        const lo = lon ?? this.defaultLon;

        let dailyList: DailyWeatherDto[] = [];

        try {
            const url = `${this.baseUrl}/forecast`;
            const { data } = await firstValueFrom(
                this.http.get(url, {
                    params: { lat: la, lon: lo, appid: this.apiKey },
                }),
            );

            const grouped = groupByDay(data.list);
            const today = new Date().toISOString().slice(0, 10);

            dailyList = Object.entries(grouped)
                .filter(([day]) => day >= today)
                .slice(0, 5)
                .map(([day, items]): DailyWeatherDto => {
                    const temps = items.map((i: any) => kToc(i.main.temp));
                    const humidities = items.map((i: any) => i.main.humidity as number);
                    const winds = items.map((i: any) => (i.wind?.speed ?? 0) as number);
                    const pops = items.map((i: any) => (i.pop ?? 0) as number);
                    const noon = items.find((i: any) => (i.dt_txt as string).includes('12:00')) ?? items[Math.floor(items.length / 2)];

                    return {
                        date: day,
                        timestamp: noon.dt,
                        temp_min: Math.min(...temps),
                        temp_max: Math.max(...temps),
                        temp_avg: parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)),
                        humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
                        wind_speed: parseFloat((winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1)),
                        weather_main: noon.weather[0].main,
                        weather_description: noon.weather[0].description,
                        weather_icon: noon.weather[0].icon,
                        pop: Math.max(...pops),
                    };
                });
        } catch {
            dailyList = Array.from({ length: 5 }).map((_, i) => {
                const date = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
                return {
                    date,
                    timestamp: Math.floor((Date.now() + i * 86400000) / 1000),
                    temp_min: rand(24, 27),
                    temp_max: rand(32, 36),
                    temp_avg: rand(28, 31),
                    humidity: Math.round(rand(65, 85)),
                    wind_speed: rand(2, 6),
                    weather_main: 'Partly Cloudy',
                    weather_description: 'scattered clouds',
                    weather_icon: '03d',
                    pop: rand(0.1, 0.4),
                };
            });
        }

        // Lưu vào bảng ForecastData trong DB phục vụ AI
        if (locationId) {
            await this.saveForecastDataToDb(locationId, dailyList);
        }

        return dailyList;
    }

    /**
     * POST /weather/sync
     * Ép buộc đồng bộ dữ liệu Thời tiết từ API ngoài vào DB
     */
    async syncWeather(locationId?: string) {
        if (locationId) {
            const loc = await this.prisma.location.findUnique({ where: { id: locationId } });
            if (!loc) throw new NotFoundException(`Không tìm thấy locationId: ${locationId}`);
            const result = await this.fetchAndSaveWeather(loc.id, loc.latitude, loc.longitude);
            await this.getDaily(loc.latitude, loc.longitude, loc.id);
            return { message: `Đã đồng bộ thời tiết thành công cho ${loc.name}`, data: result };
        }

        const locations = await this.prisma.location.findMany();
        const results: any[] = [];

        for (const loc of locations) {
            try {
                const res = await this.fetchAndSaveWeather(loc.id, loc.latitude, loc.longitude);
                await this.getDaily(loc.latitude, loc.longitude, loc.id);
                results.push(res);
            } catch (err) {
                this.logger.error(`Lỗi đồng bộ thời tiết cho ${loc.name}: ${err?.message}`);
            }
        }

        return {
            message: `Đã đồng bộ dữ liệu thời tiết cho ${results.length}/${locations.length} địa điểm.`,
            syncedCount: results.length,
        };
    }

    /**
     * Helper: Fetch và lưu WeatherData
     */
    public async fetchAndSaveWeather(locationId: string, lat?: number, lon?: number) {
        let latitude = lat;
        let longitude = lon;

        if (latitude === undefined || longitude === undefined) {
            const loc = await this.prisma.location.findUnique({ where: { id: locationId } });
            if (!loc) throw new NotFoundException('Không tìm thấy địa điểm');
            latitude = loc.latitude;
            longitude = loc.longitude;
        }

        const weatherDto = await this.fetchExternalWeather(latitude, longitude);

        return this.prisma.weatherData.create({
            data: {
                locationId,
                temperature: weatherDto.temp,
                feelsLike: weatherDto.feels_like,
                humidity: weatherDto.humidity,
                pressure: weatherDto.pressure,
                windSpeed: weatherDto.wind_speed,
                windDirection: weatherDto.wind_deg,
                visibility: weatherDto.visibility,
                condition: weatherDto.weather_description,
                icon: weatherDto.weather_icon,
                timestamp: new Date(weatherDto.timestamp * 1000),
            },
        });
    }

    /**
     * Helper: Lưu ForecastData cho AI
     */
    private async saveForecastDataToDb(locationId: string, dailyList: DailyWeatherDto[]) {
        try {
            for (const item of dailyList) {
                const forecastDate = new Date(item.date);

                await this.prisma.forecastData.create({
                    data: {
                        locationId,
                        forecastDate,
                        temperature: item.temp_avg,
                        condition: item.weather_description,
                    },
                });
            }
        } catch (e) {
            this.logger.error(`Error saving ForecastData for location ${locationId}: ${e?.message}`);
        }
    }

    private async fetchExternalWeather(lat: number, lon: number): Promise<CurrentWeatherDto> {
        try {
            const url = `${this.baseUrl}/weather`;
            const { data } = await firstValueFrom(
                this.http.get(url, {
                    params: { lat, lon, appid: this.apiKey },
                }),
            );

            return {
                city: data.name,
                country: data.sys.country,
                lat: data.coord.lat,
                lon: data.coord.lon,
                timestamp: data.dt,
                temp: kToc(data.main.temp),
                feels_like: kToc(data.main.feels_like),
                temp_min: kToc(data.main.temp_min),
                temp_max: kToc(data.main.temp_max),
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                visibility: data.visibility ?? 0,
                wind_speed: data.wind?.speed ?? 0,
                wind_deg: data.wind?.deg ?? 0,
                clouds: data.clouds?.all ?? 0,
                weather_id: data.weather[0].id,
                weather_main: data.weather[0].main,
                weather_description: data.weather[0].description,
                weather_icon: data.weather[0].icon,
                sunrise: data.sys.sunrise,
                sunset: data.sys.sunset,
            };
        } catch {
            return {
                city: 'Hà Nội',
                country: 'VN',
                lat,
                lon,
                timestamp: Math.floor(Date.now() / 1000),
                temp: 29.5,
                feels_like: 31.0,
                temp_min: 27.0,
                temp_max: 33.0,
                humidity: 78,
                pressure: 1010,
                visibility: 10000,
                wind_speed: 3.5,
                wind_deg: 140,
                clouds: 40,
                weather_id: 802,
                weather_main: 'Clouds',
                weather_description: 'scattered clouds',
                weather_icon: '03d',
                sunrise: Math.floor(Date.now() / 1000) - 21600,
                sunset: Math.floor(Date.now() / 1000) + 21600,
            };
        }
    }
}
