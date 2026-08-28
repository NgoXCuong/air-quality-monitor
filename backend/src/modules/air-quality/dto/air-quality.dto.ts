import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryAirQualityDto {
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

export class QueryAirQualityHistoryDto {
    @ApiPropertyOptional({ example: 30, description: 'Số bản ghi lịch sử tối đa' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 30;

    @ApiPropertyOptional({ description: 'ID địa điểm trong DB (UUID)' })
    @IsOptional()
    @IsString()
    locationId?: string;
}
