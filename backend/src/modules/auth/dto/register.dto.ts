import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'Nguyen Van A',
        description: 'Họ và tên',
    })
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    fullName: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'Địa chỉ email',
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({
        example: 'password123',
        description: 'Mật khẩu (tối thiểu 6 ký tự)',
    })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(6, {
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
    })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
        message: 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số',
    })
    password: string;
}