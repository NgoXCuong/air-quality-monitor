import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLocationDto {
    @ApiProperty({ example: 'Hà Nội', description: 'Tên địa điểm / thành phố' })
    @IsString()
    @IsNotEmpty({ message: 'Tên địa điểm không được để trống' })
    name: string;

    @ApiPropertyOptional({ example: 'Hà Nội', description: 'Tỉnh / Thành phố trực thuộc TW' })
    @IsOptional()
    @IsString()
    province?: string;

    @ApiPropertyOptional({ example: 'Hoàn Kiếm', description: 'Quận / Huyện' })
    @IsOptional()
    @IsString()
    district?: string;

    @ApiPropertyOptional({ example: 'Hàng Bạc', description: 'Phường / Xã' })
    @IsOptional()
    @IsString()
    ward?: string;

    @ApiProperty({ example: 21.0285, description: 'Vĩ độ (-90 đến 90)' })
    @IsLatitude({ message: 'Vĩ độ không hợp lệ' })
    latitude: number;

    @ApiProperty({ example: 105.8542, description: 'Kinh độ (-180 đến 180)' })
    @IsLongitude({ message: 'Kinh độ không hợp lệ' })
    longitude: number;

    @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh', description: 'Múi giờ' })
    @IsOptional()
    @IsString()
    timezone?: string = 'Asia/Ho_Chi_Minh';

    @ApiPropertyOptional({ example: 'Vietnam', description: 'Quốc gia' })
    @IsOptional()
    @IsString()
    country?: string = 'Vietnam';
}
