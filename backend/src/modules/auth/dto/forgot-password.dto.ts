import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email tài khoản cần reset mật khẩu' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;
}
