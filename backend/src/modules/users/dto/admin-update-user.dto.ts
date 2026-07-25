import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class AdminUpdateUserDto {
    @ApiPropertyOptional({
        enum: Role,
        example: Role.USER,
        description: 'Vai trò của người dùng',
    })
    @IsOptional()
    @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
    role?: Role;

    @ApiPropertyOptional({
        example: true,
        description: 'Trạng thái hoạt động của tài khoản',
    })
    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Trạng thái xác thực email',
    })
    @IsOptional()
    @IsBoolean()
    isVerified?: boolean;
}
