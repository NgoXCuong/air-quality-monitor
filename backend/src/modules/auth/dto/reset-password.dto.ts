import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ description: 'Token reset mật khẩu từ email' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 6 ký tự)' })
    @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    newPassword: string;
}
