import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchLocationDto {
    @ApiPropertyOptional({
        example: 'Ha',
        description: 'Từ khóa tìm kiếm (tên, tỉnh, quận/huyện, phường/xã)',
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({
        example: 10,
        description: 'Số lượng kết quả tối đa trả về cho Autocomplete',
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 10;
}
