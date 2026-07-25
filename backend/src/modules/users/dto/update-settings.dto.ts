import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
    @ApiPropertyOptional({
        example: true,
        description: 'Nhận cảnh báo qua email',
    })
    @IsOptional()
    @IsBoolean()
    emailAlerts?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Nhận cảnh báo push notification',
    })
    @IsOptional()
    @IsBoolean()
    pushAlerts?: boolean;

    @ApiPropertyOptional({
        example: 100,
        description: 'Ngưỡng AQI để kích hoạt cảnh báo (0 - 500)',
    })
    @IsOptional()
    @IsNumber({}, { message: 'Ngưỡng AQI phải là số' })
    @Min(0, { message: 'Ngưỡng AQI tối thiểu là 0' })
    @Max(500, { message: 'Ngưỡng AQI tối đa là 500' })
    aqiThreshold?: number;

    @ApiPropertyOptional({
        example: 'vi',
        description: 'Ngôn ngữ giao diện (vi, en)',
    })
    @IsOptional()
    language?: string;
}
