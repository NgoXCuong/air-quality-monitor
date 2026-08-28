import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

// ─────────────────────────────────────────────────────────────────────────────
// Weather DTOs – chuẩn hóa response & class-validator cho NestJS
// ─────────────────────────────────────────────────────────────────────────────

export class WeatherQueryDto {
    @ApiPropertyOptional({ example: 21.0285, description: 'Vĩ độ (Latitude)' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value as string))
    @IsLatitude()
    lat?: number;

    @ApiPropertyOptional({ example: 105.8542, description: 'Kinh độ (Longitude)' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value as string))
    @IsLongitude()
    lon?: number;

    @ApiPropertyOptional({ description: 'ID địa điểm trong DB (UUID)' })
    @IsOptional()
    @IsString()
    locationId?: string;
}

// ── Current Weather ──────────────────────────────────────────────────────────

export interface CurrentWeatherDto {
    city: string;
    country: string;
    lat: number;
    lon: number;
    timestamp: number;         // Unix seconds
    temp: number;              // °C
    feels_like: number;        // °C
    temp_min: number;          // °C
    temp_max: number;          // °C
    humidity: number;          // %
    pressure: number;          // hPa
    visibility: number;        // meters
    wind_speed: number;        // m/s
    wind_deg: number;          // degrees
    clouds: number;            // %
    weather_id: number;        // OWM icon id
    weather_main: string;      // e.g. "Rain"
    weather_description: string; // e.g. "light rain"
    weather_icon: string;      // e.g. "10d"
    sunrise: number;
    sunset: number;
}

// ── Hourly ───────────────────────────────────────────────────────────────────

export interface HourlyWeatherDto {
    timestamp: number;
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_deg: number;
    clouds: number;
    weather_main: string;
    weather_description: string;
    weather_icon: string;
    pop: number;
}

// ── Daily ────────────────────────────────────────────────────────────────────

export interface DailyWeatherDto {
    date: string;              // "YYYY-MM-DD"
    timestamp: number;
    temp_min: number;
    temp_max: number;
    temp_avg: number;
    humidity: number;
    wind_speed: number;
    weather_main: string;
    weather_description: string;
    weather_icon: string;
    pop: number;
}

// ── History (mock / DB) ──────────────────────────────────────────────────────

export interface HistoryWeatherDto {
    date: string;              // "YYYY-MM-DD"
    timestamp: number;
    temp_min: number;
    temp_max: number;
    temp_avg: number;
    humidity: number;
    wind_speed: number;
    pressure: number;
    weather_main: string;
    weather_description: string;
    weather_icon: string;
    is_mock?: boolean;
}
