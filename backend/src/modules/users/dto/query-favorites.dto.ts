import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryFavoritesDto {
    @ApiPropertyOptional({
        example: 'Hà Nội',
        description: 'Tìm kiếm theo tên, tỉnh, quận/huyện của địa điểm',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        example: 'Hà Nội',
        description: 'Lọc theo tỉnh/thành phố',
    })
    @IsOptional()
    @IsString()
    province?: string;

    @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Số bản ghi mỗi trang' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}
