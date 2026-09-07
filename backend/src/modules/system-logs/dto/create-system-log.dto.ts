import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogLevel } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSystemLogDto {
    @ApiProperty({
        description: 'Mức độ log: INFO, WARN, ERROR',
        enum: LogLevel,
        example: LogLevel.INFO,
    })
    @IsEnum(LogLevel)
    level: LogLevel;

    @ApiProperty({
        description: 'Ngữ cảnh hoặc module phát sinh log',
        example: 'Scheduler',
    })
    @IsString()
    @IsNotEmpty()
    context: string;

    @ApiProperty({
        description: 'Nội dung chi tiết của log',
        example: 'Đã hoàn thành đồng bộ dữ liệu quan trắc cho 10 trạm.',
    })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiPropertyOptional({
        description: 'Metadata hoặc payload bổ sung dạng JSON object (stack trace, thông số request, v.v.)',
        example: { stationCount: 10, durationMs: 1420 },
    })
    @IsOptional()
    @IsObject()
    meta?: Record<string, any>;
}

export class CleanupLogsDto {
    @ApiPropertyOptional({
        description: 'Số ngày lưu trữ tối đa (những log cũ hơn N ngày sẽ bị xóa vĩnh viễn)',
        default: 30,
        example: 30,
    })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value as string, 10) : 30))
    @IsInt()
    @Min(1)
    @Max(365)
    days?: number = 30;
}
