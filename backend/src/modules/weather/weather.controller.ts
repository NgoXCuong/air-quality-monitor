import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { WeatherService } from './weather.service';
import { WeatherQueryDto } from './dto/weather.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Weather (Thời tiết)')
@Controller('weather')
export class WeatherController {
    constructor(private readonly weatherService: WeatherService) {}

    @Public()
    @Get('current')
    @ApiOperation({
        summary: 'Thời tiết hiện tại',
        description: 'Đọc từ Database (RESTful - Không side-effect). Nếu chưa có sẽ khởi tạo dữ liệu ban đầu.',
    })
    getCurrentWeather(@Query() query: WeatherQueryDto) {
        return this.weatherService.getCurrentWeather(query);
    }

    @Public()
    @Get('history')
    @ApiOperation({
        summary: 'Lịch sử thời tiết từ Database',
        description: 'Lấy lịch sử đo thời tiết (nhiệt độ, độ ẩm, gió...) của địa điểm.',
    })
    @ApiQuery({ name: 'locationId', required: true, description: 'ID địa điểm (UUID)' })
    @ApiQuery({ name: 'limit', required: false, example: 30 })
    getWeatherHistory(
        @Query('locationId') locationId: string,
        @Query('limit') limit?: number,
    ) {
        return this.weatherService.getWeatherHistory(locationId, limit);
    }

    @Public()
    @Get('hourly')
    @ApiOperation({
        summary: 'Dự báo theo giờ (8 mốc × 3h = 24h tới)',
    })
    getHourly(@Query() query: WeatherQueryDto) {
        return this.weatherService.getHourly(query.lat, query.lon);
    }

    @Public()
    @Get('daily')
    @ApiOperation({
        summary: 'Dự báo theo ngày (5 ngày tới)',
        description: 'Tự động lưu bảng ForecastData phục vụ trợ lý AI.',
    })
    getDaily(@Query() query: WeatherQueryDto) {
        return this.weatherService.getDaily(query.lat, query.lon, query.locationId);
    }

    @Post('sync')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '[ADMIN] Ép buộc đồng bộ dữ liệu Thời tiết từ API ngoài vào Database',
    })
    @ApiQuery({ name: 'locationId', required: false, description: 'ID địa điểm (nếu để trống sẽ sync tất cả)' })
    syncWeather(@Query('locationId') locationId?: string) {
        return this.weatherService.syncWeather(locationId);
    }
}
