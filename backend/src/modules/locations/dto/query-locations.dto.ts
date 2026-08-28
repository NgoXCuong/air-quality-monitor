import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryLocationsDto {
    @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20, description: 'Số bản ghi mỗi trang' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        example: 'Hà Nội',
        description: 'Tìm kiếm theo tên địa điểm, tỉnh thành hoặc quận huyện',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        example: 'Đà Nẵng',
        description: 'Lọc theo tên tỉnh / thành phố',
    })
    @IsOptional()
    @IsString()
    province?: string;
}
