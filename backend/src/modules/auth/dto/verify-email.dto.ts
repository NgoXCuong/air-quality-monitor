import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
    @ApiProperty({ description: 'Token xác thực email từ link được gửi qua email' })
    @IsString()
    @IsNotEmpty()
    token: string;
}
