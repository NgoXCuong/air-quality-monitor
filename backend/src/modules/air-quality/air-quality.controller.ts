import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { AirQualityService } from './air-quality.service';
import { QueryAirQualityDto, QueryAirQualityHistoryDto } from './dto/air-quality.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Air Quality (Chất lượng không khí)')
@Controller('air-quality')
export class AirQualityController {
    constructor(private readonly airQualityService: AirQualityService) {}

    @Public()
    @Get('current')
    @ApiOperation({
        summary: 'Lấy chỉ số chất lượng không khí (AQI) hiện tại',
        description: 'Đọc từ Database (RESTful - Không side-effect). Nếu chưa có sẽ khởi tạo dữ liệu ban đầu.',
    })
    getCurrentAirQuality(@Query() query: QueryAirQualityDto) {
        return this.airQualityService.getCurrentAirQuality(query);
    }

    @Public()
    @Get('history')
    @ApiOperation({
        summary: 'Lấy lịch sử chỉ số AQI & các chất ô nhiễm từ Database',
        description: 'Dùng cho biểu đồ đường biến thiên chất lượng không khí trên Frontend.',
    })
    getAirQualityHistory(@Query() query: QueryAirQualityHistoryDto) {
        return this.airQualityService.getAirQualityHistory(query);
    }

    @Post('sync')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '[ADMIN] Ép buộc đồng bộ dữ liệu AQI từ API ngoài vào Database',
        description: 'Gọi API dịch vụ ngoài để lấy nồng độ bụi mịn PM2.5, PM10... và chèn vào DB.',
    })
    @ApiQuery({ name: 'locationId', required: false, description: 'ID địa điểm (nếu để trống sẽ sync tất cả)' })
    syncAirQuality(@Query('locationId') locationId?: string) {
        return this.airQualityService.syncAirQuality(locationId);
    }
}
