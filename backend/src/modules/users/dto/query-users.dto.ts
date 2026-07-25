import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class QueryUsersDto {
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

    @ApiPropertyOptional({
        example: 'nguyen',
        description: 'Tìm kiếm theo tên hoặc email',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: Role, description: 'Lọc theo vai trò' })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiPropertyOptional({
        example: true,
        description: 'Lọc theo trạng thái hoạt động',
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value as boolean;
    })
    @IsBoolean()
    status?: boolean;
}
