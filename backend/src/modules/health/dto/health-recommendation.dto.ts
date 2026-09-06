import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryHealthRecommendationsDto {
    @ApiPropertyOptional({ description: 'Chỉ số AQI hiện tại (0 - 500)', example: 125 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseInt(value as string, 10) : undefined))
    @IsInt()
    @Min(0)
    @Max(500)
    aqi?: number;

    @ApiPropertyOptional({
        description: 'Nhóm đối tượng: GENERAL, CHILDREN, RESPIRATORY, FITNESS hoặc ALL',
        example: 'RESPIRATORY',
        enum: ['ALL', 'GENERAL', 'CHILDREN', 'RESPIRATORY', 'FITNESS'],
    })
    @IsOptional()
    @IsString()
    targetGroup?: string;
}

export class CreateHealthRecommendationDto {
    @ApiProperty({ description: 'Ngưỡng AQI nhỏ nhất', example: 101 })
    @IsInt()
    @Min(0)
    @Max(500)
    minAqi: number;

    @ApiProperty({ description: 'Ngưỡng AQI lớn nhất', example: 150 })
    @IsInt()
    @Min(0)
    @Max(500)
    maxAqi: number;

    @ApiProperty({
        description: 'Nhóm đối tượng: GENERAL, CHILDREN, RESPIRATORY, FITNESS',
        example: 'RESPIRATORY',
    })
    @IsString()
    targetGroup: string;

    @ApiProperty({ description: 'Tiêu đề khuyến cáo', example: 'Cảnh báo: Bệnh nhân Hen suyễn & Dị ứng' })
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Nội dung chi tiết lời khuyên y tế',
        example: 'Bụi mịn PM2.5 dễ gây co thắt phế quản và khó thở. Hãy hạn chế ra ngoài đường vào giờ cao điểm.',
    })
    @IsString()
    description: string;

    @ApiPropertyOptional({
        description: 'Danh sách hành động phòng vệ cụ thể',
        example: ['Đeo khẩu trang N95 có van lọc', 'Mang theo bình xịt giãn phế quản', 'Súc họng nước muối ấm'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    actions?: string[];
}

export class UpdateHealthRecommendationDto {
    @ApiPropertyOptional({ example: 101 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(500)
    minAqi?: number;

    @ApiPropertyOptional({ example: 150 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(500)
    maxAqi?: number;

    @ApiPropertyOptional({ example: 'RESPIRATORY' })
    @IsOptional()
    @IsString()
    targetGroup?: string;

    @ApiPropertyOptional({ example: 'Cảnh báo cập nhật' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: 'Nội dung chi tiết cập nhật' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    actions?: string[];
}
