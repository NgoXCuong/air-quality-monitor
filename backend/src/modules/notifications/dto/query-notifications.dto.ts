import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AlertType, NotificationStatus } from '@prisma/client';

export class QueryNotificationsDto {
    @ApiPropertyOptional({ description: 'Trang hiện tại (bắt đầu từ 1)', example: 1, default: 1 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value as string, 10) : 1))
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Số lượng thông báo mỗi trang', example: 20, default: 20 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value as string, 10) : 20))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Trạng thái thông báo: UNREAD hoặc READ',
        enum: NotificationStatus,
    })
    @IsOptional()
    @IsEnum(NotificationStatus)
    status?: NotificationStatus;

    @ApiPropertyOptional({
        description: 'Loại cảnh báo: WEATHER, AQI, HEALTH, SYSTEM',
        enum: AlertType,
    })
    @IsOptional()
    @IsEnum(AlertType)
    type?: AlertType;
}

export class TestAlertDto {
    @ApiPropertyOptional({ description: 'ID địa điểm kiểm tra' })
    @IsOptional()
    @IsString()
    locationId?: string;

    @ApiPropertyOptional({ description: 'Tên địa điểm', example: 'Hà Nội' })
    @IsOptional()
    @IsString()
    locationName?: string;

    @ApiPropertyOptional({ description: 'Chỉ số AQI giả định', example: 165 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value as string, 10) : 165))
    @IsInt()
    aqi?: number;

    @ApiPropertyOptional({ description: 'Nồng độ bụi PM2.5 (µg/m³)', example: 82.5 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value as string) : 82.5))
    @IsNumber()
    pm25?: number;
}
