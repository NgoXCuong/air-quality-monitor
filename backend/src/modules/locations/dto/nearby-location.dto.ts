import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class NearbyLocationDto {
    @ApiProperty({ example: 21.0285, description: 'Vĩ độ (Latitude) hiện tại' })
    @Transform(({ value }) => parseFloat(value as string))
    @IsLatitude({ message: 'Vĩ độ không hợp lệ' })
    lat: number;

    @ApiProperty({ example: 105.8542, description: 'Kinh độ (Longitude) hiện tại' })
    @Transform(({ value }) => parseFloat(value as string))
    @IsLongitude({ message: 'Kinh độ không hợp lệ' })
    lon: number;

    @ApiPropertyOptional({ example: 20, description: 'Bán kính tìm kiếm (km), mặc định 20km' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value as string))
    @IsNumber()
    @Min(0.1)
    @Max(500)
    radius?: number = 20;

    @ApiPropertyOptional({ example: 10, description: 'Số lượng kết quả tối đa' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 10;

    @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.ASC, description: 'Sắp xếp theo khoảng cách (ASC: gần -> xa, DESC: xa -> gần)' })
    @IsOptional()
    @IsEnum(SortOrder)
    sort?: SortOrder = SortOrder.ASC;
}
