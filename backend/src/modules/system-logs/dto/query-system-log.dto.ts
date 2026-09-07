import { ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class QuerySystemLogDto {
    @ApiPropertyOptional({ description: 'Trang hiện tại (bắt đầu từ 1)', default: 1, example: 1 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value as string, 10) : 1))
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Số bản ghi trên mỗi trang (tối đa 100)', default: 20, example: 20 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value as string, 10) : 20))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Mức độ log: INFO, WARN, ERROR',
        enum: LogLevel,
        example: LogLevel.ERROR,
    })
    @IsOptional()
    @IsEnum(LogLevel)
    level?: LogLevel;

    @ApiPropertyOptional({
        description: 'Nguồn/Ngữ cảnh phát sinh log (Scheduler, Auth, WeatherSync, AirQualitySync, Forecast, v.v.)',
        example: 'Scheduler',
    })
    @IsOptional()
    @IsString()
    context?: string;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm trong nội dung thông điệp log',
        example: 'Open-Meteo',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Thời điểm bắt đầu lọc (ISO-8601 format)',
        example: '2026-09-01T00:00:00.000Z',
    })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Thời điểm kết thúc lọc (ISO-8601 format)',
        example: '2026-09-07T23:59:59.999Z',
    })
    @IsOptional()
    @IsISO8601()
    endDate?: string;
}
