import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({
        example: 'Nguyen Van A',
        description: 'Họ và tên đầy đủ',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
    fullName?: string;

    @ApiPropertyOptional({
        example: '0912345678',
        description: 'Số điện thoại',
    })
    @IsOptional()
    @IsString()
    @Matches(/^(\+84|84|0)(3|5|7|8|9)\d{8}$/, {
        message: 'Số điện thoại không hợp lệ (VD: 0912345678)',
    })
    phone?: string;

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.jpg',
        description: 'URL ảnh đại diện',
    })
    @IsOptional()
    @IsUrl({}, { message: 'URL ảnh đại diện không hợp lệ' })
    avatar?: string;
}
