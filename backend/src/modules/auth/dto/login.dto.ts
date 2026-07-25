import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength, Matches } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'Địa chỉ email' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
        message: 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số',
    })
    password: string;
}