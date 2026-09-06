import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class Query24hForecastDto {
    @ApiPropertyOptional({ description: 'ID địa điểm trong DB (UUID)', example: 'loc-hn' })
    @IsOptional()
    @IsString()
    locationId?: string;

    @ApiPropertyOptional({ example: 21.0285, description: 'Vĩ độ (Latitude)' })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value as string) : undefined))
    @IsLatitude()
    lat?: number;

    @ApiPropertyOptional({ example: 105.8542, description: 'Kinh độ (Longitude)' })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value as string) : undefined))
    @IsLongitude()
    lon?: number;

    @ApiPropertyOptional({
        description: 'Bỏ qua cache DB và ép buộc mô hình AI sinh dự báo mới',
        example: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    forceRefresh?: boolean;
}

export class QueryForecastHistoryDto {
    @ApiPropertyOptional({ description: 'ID địa điểm (UUID)' })
    @IsOptional()
    @IsString()
    locationId?: string;

    @ApiPropertyOptional({ description: 'Số ngày lịch sử cần xem', example: 7, default: 7 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value as string, 10) : 7))
    @IsNumber()
    @Min(1)
    days?: number = 7;
}

export interface ForecastHourResponse {
    forecastHour: number;
    targetTime: string;
    temperature: number;
    humidity: number;
    predictedPm25: number;
    predictedAqi: number;
    category: string;
    categoryBadge: string;
    color: string;
    confidence: number;
    modelVersion: string;
}
